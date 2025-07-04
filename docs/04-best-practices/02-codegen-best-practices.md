# GraphQL Code Generator Best Practices

## Table of Contents

- [Overview](#overview)
- [Architecture Decision: Prisma Types vs GraphQL Types](#architecture-decision-prisma-types-vs-graphql-types)
  - [Core Principle](#core-principle)
  - [Why This Separation?](#why-this-separation)
- [Implementation Patterns](#implementation-patterns)
  - [Service Layer Pattern](#service-layer-pattern)
  - [Resolver Layer Pattern](#resolver-layer-pattern)
- [Transformation Helpers](#transformation-helpers)
  - [When to Use Transformation Helpers](#when-to-use-transformation-helpers)
  - [Basic Transformation Pattern](#basic-transformation-pattern)
  - [Advanced Transformation with Computed Fields](#advanced-transformation-with-computed-fields)
- [Best Practices](#best-practices)
  - [Do's ✅](#dos-)
  - [Don'ts ❌](#donts-)
- [Federation Patterns](#federation-patterns)
  - [Extending Types Across Services](#extending-types-across-services)
  - [Reference Resolvers](#reference-resolvers)
- [Migration Strategy](#migration-strategy)
  - [Phase 1: Generate Types](#phase-1-generate-types)
  - [Phase 2: Add Type Imports](#phase-2-add-type-imports)
  - [Phase 3: Type Methods Gradually](#phase-3-type-methods-gradually)
  - [Phase 4: Add Transformations](#phase-4-add-transformations)
- [Common Patterns](#common-patterns)
  - [Pagination with Type Safety](#pagination-with-type-safety)
  - [Error Handling](#error-handling)
  - [Testing with Generated Types](#testing-with-generated-types)
- [Development Workflow](#development-workflow)
- [Debugging Tips](#debugging-tips)
  - [Type Mismatch Errors](#type-mismatch-errors)
  - [Missing __typename](#missing-__typename)
  - [Date Serialization](#date-serialization)
- [Performance Considerations](#performance-considerations)
  - [Batch Loading](#batch-loading)
  - [Selective Fields](#selective-fields)
- [Next Steps](#next-steps)

## Overview

This guide covers implementation patterns and best practices for using GraphQL Code Generator in a NestJS microservices architecture with Prisma ORM.

## Architecture Decision: Prisma Types vs GraphQL Types

### Core Principle

**Service Layer**: Use Prisma types (database models)
**Resolver Layer**: Use GraphQL types (API contracts)

### Why This Separation?

1. **Decoupling** - API can evolve independently from database schema
2. **Flexibility** - Hide internal fields, add computed properties
3. **Type Safety** - Each layer has appropriate types for its purpose
4. **Maintainability** - Clear boundaries between layers

```typescript
// ❌ Bad: GraphQL types in service
class UsersService {
  async findAll(): Promise<IUser[]> {  // IUser is GraphQL type
    return this.prisma.user.findMany()
  }
}

// ✅ Good: Prisma types in service
class UsersService {
  async findAll(): Promise<PrismaUser[]> {  // PrismaUser is Prisma type
    return this.prisma.user.findMany()
  }
}
```

## Implementation Patterns

### Service Layer Pattern

Services should work with Prisma types and focus on business logic:

```typescript
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { User as PrismaUser } from '@prisma/client-users'
import { ICreateUserInput } from '../../generated/graphql'
import * as bcrypt from 'bcryptjs'

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<PrismaUser[]> {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    })
  }

  async findOneById(id: string): Promise<PrismaUser | null> {
    return this.prisma.user.findUnique({
      where: { id }
    })
  }

  async create(input: ICreateUserInput): Promise<PrismaUser> {
    // Business logic: hash password
    const hashedPassword = await bcrypt.hash(input.password, 10)
    
    return this.prisma.user.create({
      data: {
        ...input,
        password: hashedPassword
      }
    })
  }
}
```

### Resolver Layer Pattern

Resolvers handle GraphQL concerns and type transformations:

```typescript
import { Resolver, Query, Mutation, Args, ResolveField, Parent } from '@nestjs/graphql'
import { UsersService } from './users.service'
import { User } from './entities/user.entity'
import { 
  IQueryResolvers, 
  IMutationResolvers,
  IUserResolvers 
} from '../../generated/graphql'
import { User as PrismaUser } from '@prisma/client-users'

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => [User], { name: 'users' })
  async findAll(): ReturnType<IQueryResolvers['users']> {
    const users = await this.usersService.findAll()
    return users.map(user => this.toGraphQLUser(user))
  }

  @Mutation(() => User)
  async createUser(
    @Args('createUserInput') createUserInput: Parameters<IMutationResolvers['createUser']>[1]['createUserInput']
  ): ReturnType<IMutationResolvers['createUser']> {
    const user = await this.usersService.create(createUserInput)
    return this.toGraphQLUser(user)
  }

  // Transform Prisma model to GraphQL type
  private toGraphQLUser(user: PrismaUser) {
    return {
      ...user,
      __typename: 'User' as const
    }
  }
}
```

## Transformation Helpers

### When to Use Transformation Helpers

Use transformation helpers when:
- Converting between Prisma and GraphQL types
- Adding computed fields
- Hiding sensitive data
- Formatting dates or other values

### Basic Transformation Pattern

```typescript
// Transform single entity
function toGraphQLUser(user: PrismaUser): IUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt.toISOString(), // Date to string
    updatedAt: user.updatedAt.toISOString(),
    __typename: 'User' as const
  }
}

// Transform arrays
function toGraphQLUsers(users: PrismaUser[]): IUser[] {
  return users.map(toGraphQLUser)
}
```

### Advanced Transformation with Computed Fields

```typescript
function toGraphQLProduct(product: PrismaProduct & { _count?: { orders: number } }): IProduct {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    stock: product.stock,
    // Computed field
    isAvailable: product.stock > 0,
    // Optional count from Prisma
    orderCount: product._count?.orders ?? 0,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    __typename: 'Product' as const
  }
}
```

## Best Practices

### Do's ✅

1. **Type Everything Explicitly**
   ```typescript
   // Explicitly type resolver methods
   const createUser: IMutationResolvers['createUser'] = async (_, args, context) => {
     // Implementation
   }
   ```

2. **Use Type Imports**
   ```typescript
   import type { IUser, ICreateUserInput } from '../../generated/graphql'
   ```

3. **Validate Input at Resolver Level**
   ```typescript
   if (!isValidUUID(args.id)) {
     throw new InvalidFormatException('Invalid user ID format')
   }
   ```

4. **Keep Transformations Simple**
   ```typescript
   // One transformation function per entity type
   const toGraphQLUser = (user: PrismaUser): IUser => ({
     ...user,
     __typename: 'User' as const
   })
   ```

5. **Use Generated Enums**
   ```typescript
   import { IOrderStatus } from '../../generated/graphql'
   
   if (status === IOrderStatus.Completed) {
     // Handle completed order
   }
   ```

### Don'ts ❌

1. **Don't Use GraphQL Types in Services**
   ```typescript
   // ❌ Bad
   class ProductService {
     async findAll(): Promise<IProduct[]> {
       return this.prisma.product.findMany()
     }
   }
   ```

2. **Don't Ignore Type Errors**
   ```typescript
   // ❌ Bad
   return user as any
   
   // ✅ Good
   return toGraphQLUser(user)
   ```

3. **Don't Mix Layers**
   ```typescript
   // ❌ Bad: Prisma query in resolver
   @Query()
   async users() {
     return this.prisma.user.findMany()
   }
   
   // ✅ Good: Use service
   @Query()
   async users() {
     const users = await this.usersService.findAll()
     return users.map(toGraphQLUser)
   }
   ```

## Federation Patterns

### Extending Types Across Services

```typescript
// In Products service - extending User type
@Resolver(() => User)
export class UserResolver {
  constructor(private readonly productsService: ProductsService) {}

  @ResolveField(() => [Product])
  async products(
    @Parent() user: User
  ): ReturnType<IUserResolvers['products']> {
    const products = await this.productsService.findByUserId(user.id)
    return products.map(toGraphQLProduct)
  }
}
```

### Reference Resolvers

```typescript
@Resolver(() => User)
export class UserResolver {
  @ResolveReference()
  async resolveReference(
    reference: { __typename: string; id: string }
  ): Promise<IUser | null> {
    const user = await this.usersService.findOneById(reference.id)
    return user ? toGraphQLUser(user) : null
  }
}
```

## Migration Strategy

For existing projects, migrate progressively:

### Phase 1: Generate Types
```bash
pnpm codegen
```

### Phase 2: Add Type Imports
```typescript
// Start by importing types without changing logic
import type { IUser, ICreateUserInput } from './generated/graphql'
```

### Phase 3: Type Methods Gradually
```typescript
// Type one resolver at a time
const findAll: IQueryResolvers['users'] = async () => {
  // Existing implementation
}
```

### Phase 4: Add Transformations
```typescript
// Add transformation helpers
const users = await this.usersService.findAll()
return users.map(toGraphQLUser)
```

## Common Patterns

### Pagination with Type Safety

```typescript
interface PaginationArgs {
  limit: number
  offset: number
}

const users: IQueryResolvers['users'] = async (_, args: PaginationArgs) => {
  const users = await this.prisma.user.findMany({
    take: args.limit,
    skip: args.offset,
    orderBy: { createdAt: 'desc' }
  })
  
  return {
    items: users.map(toGraphQLUser),
    total: await this.prisma.user.count(),
    hasMore: users.length === args.limit
  }
}
```

### Error Handling

```typescript
const createUser: IMutationResolvers['createUser'] = async (_, args, context) => {
  try {
    // Validate input
    if (!isValidEmail(args.createUserInput.email)) {
      throw new ValidationException('Invalid email format')
    }
    
    // Check uniqueness
    const existing = await context.usersService.findByEmail(args.createUserInput.email)
    if (existing) {
      throw new ConflictException('Email already exists')
    }
    
    // Create user
    const user = await context.usersService.create(args.createUserInput)
    return toGraphQLUser(user)
    
  } catch (error) {
    // Re-throw known errors
    if (error instanceof BaseException) {
      throw error
    }
    // Wrap unknown errors
    throw new InternalServerErrorException('Failed to create user')
  }
}
```

### Testing with Generated Types

```typescript
import { ICreateUserInput } from '../../generated/graphql'

describe('UsersService', () => {
  it('should create a user', async () => {
    const input: ICreateUserInput = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123'
    }
    
    const user = await service.create(input)
    expect(user.email).toBe(input.email)
  })
})
```

## Development Workflow

1. **Define/Update GraphQL Schema** (using decorators)
2. **Run Services** to expose schemas
3. **Generate Types** with `pnpm codegen`
4. **Implement with Types** using patterns above
5. **Test** with full type safety

## Debugging Tips

### Type Mismatch Errors
```typescript
// If you see: Type 'PrismaUser' is not assignable to type 'IUser'
// Solution: Use transformation helper
return toGraphQLUser(prismaUser)
```

### Missing __typename
```typescript
// Always include __typename in transformations
return {
  ...user,
  __typename: 'User' as const  // Required for Apollo Client
}
```

### Date Serialization
```typescript
// Dates must be strings in GraphQL
createdAt: user.createdAt.toISOString()
```

## Performance Considerations

### Batch Loading
```typescript
// Use DataLoader for N+1 query prevention
@ResolveField(() => User)
async user(@Parent() product: Product) {
  return this.userLoader.load(product.userId)
}
```

### Selective Fields
```typescript
// Only select needed fields from database
async findAll(fields?: string[]) {
  return this.prisma.user.findMany({
    select: fields ? 
      Object.fromEntries(fields.map(f => [f, true])) : 
      undefined
  })
}
```

## Next Steps

- Read [GraphQL Best Practices](./graphql-best-practices.md) for more resolver patterns
- See [NX Monorepo Guide](./nx-monorepo-guide.md) for project structure
- Check [Federation Guide](./graphql-federation-guide.md) for distributed schemas