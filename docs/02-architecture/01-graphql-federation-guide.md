# GraphQL Federation Guide

## Table of Contents

- [Overview](#overview)
- [Federation Concepts](#federation-concepts)
  - [Core Principles](#core-principles)
  - [Key Components](#key-components)
- [Federation Directives](#federation-directives)
  - [@key](#key)
  - [@extends](#extends)
  - [@external](#external)
  - [@requires](#requires)
  - [@provides](#provides)
- [Setting Up Federation](#setting-up-federation)
  - [1. Configure Subgraph Services](#1-configure-subgraph-services)
  - [2. Define Entities](#2-define-entities)
  - [3. Implement Reference Resolver](#3-implement-reference-resolver)
  - [4. Extend Types Across Services](#4-extend-types-across-services)
  - [5. Configure the Gateway](#5-configure-the-gateway)
- [Advanced Federation Patterns](#advanced-federation-patterns)
  - [Entity Relationships](#entity-relationships)
  - [Computed Fields](#computed-fields)
  - [Federation with Authentication](#federation-with-authentication)
  - [Custom Directives](#custom-directives)
- [Query Planning](#query-planning)
- [Performance Optimization](#performance-optimization)
- [Error Handling in Federation](#error-handling-in-federation)
- [Testing Federation](#testing-federation)
- [Best Practices](#best-practices)
- [Common Issues and Solutions](#common-issues-and-solutions)
- [Next Steps](#next-steps)

## Overview

Apollo Federation is a powerful architecture for building a distributed GraphQL system. It allows you to divide your GraphQL API across multiple services while presenting a unified graph to clients.

## Federation Concepts

### Core Principles

1. **Separation of Concerns** - Each service owns its domain
2. **Unified Graph** - Single endpoint for clients
3. **Declarative Composition** - Services declare their capabilities
4. **Type Extensions** - Services can extend types from other services

### Key Components

- **Subgraph Services** - Individual GraphQL services (Users, Products)
- **Gateway** - Composes subgraphs into a unified API
- **Entities** - Types that can be referenced across services
- **Federation Directives** - Special directives for composition

## Federation Directives

### @key

Defines the primary key for an entity:

```typescript
@ObjectType()
@Directive('@key(fields: "id")')
export class User {
  @Field(() => ID)
  id: string

  @Field()
  email: string

  @Field()
  name: string
}
```

### @extends

Extends a type defined in another service:

```typescript
// In Products service
@ObjectType()
@Directive('@extends')
@Directive('@key(fields: "id")')
export class User {
  @Field(() => ID)
  @Directive('@external')
  id: string

  // Add new field to User
  @Field(() => [Product])
  products?: Product[]
}
```

### @external

Marks a field as owned by another service:

```typescript
@Field(() => ID)
@Directive('@external')
id: string
```

### @requires

Specifies fields needed from other services:

```typescript
@Field()
@Directive('@requires(fields: "email")')
displayName(@Parent() user: User): string {
  return `${user.name} <${user.email}>`
}
```

### @provides

Specifies fields this service can provide:

```typescript
@Field(() => User)
@Directive('@provides(fields: "name email")')
user: User
```

## Setting Up Federation

### 1. Configure Subgraph Services

Each service must be federation-enabled:

```typescript
// users-service/app.module.ts
import { ApolloFederationDriver, ApolloFederationDriverConfig } from '@nestjs/apollo'

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: {
        federation: 2,  // Use Federation v2
      },
      playground: true,
      buildSchemaOptions: {
        orphanedTypes: [],  // Include types not directly referenced
      },
    }),
  ],
})
export class AppModule {}
```

### 2. Define Entities

Create entities that can be referenced across services:

```typescript
// users-service/entities/user.entity.ts
import { ObjectType, Field, ID, Directive } from '@nestjs/graphql'

@ObjectType()
@Directive('@key(fields: "id")')
export class User {
  @Field(() => ID)
  id: string

  @Field()
  email: string

  @Field()
  name: string

  @Field()
  createdAt: Date

  @Field()
  updatedAt: Date

  // Password is not exposed in GraphQL
  password: string
}
```

### 3. Implement Reference Resolver

Reference resolvers fetch entities by their keys:

```typescript
// users-service/users.resolver.ts
@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @ResolveReference()
  async resolveReference(reference: { __typename: string; id: string }): Promise<User | null> {
    return this.usersService.findOneById(reference.id)
  }

  @Query(() => [User], { name: 'users' })
  async findAll(): Promise<User[]> {
    return this.usersService.findAll()
  }

  @Query(() => User, { nullable: true })
  async user(@Args('id') id: string): Promise<User | null> {
    return this.usersService.findOneById(id)
  }
}
```

### 4. Extend Types Across Services

In Products service, extend the User type:

```typescript
// products-service/resolvers/user.resolver.ts
@Resolver(() => User)
export class UserResolver {
  constructor(private readonly productsService: ProductsService) {}

  @ResolveField(() => [Product])
  async products(@Parent() user: User): Promise<Product[]> {
    // user only has { id } from the gateway
    return this.productsService.findByUserId(user.id)
  }
}

// products-service/entities/user.entity.ts
@ObjectType()
@Directive('@extends')
@Directive('@key(fields: "id")')
export class User {
  @Field(() => ID)
  @Directive('@external')
  id: string

  @Field(() => [Product])
  products?: Product[]
}
```

### 5. Configure the Gateway

The gateway composes all subgraphs:

```typescript
// api-gateway/app.module.ts
import { ApolloGatewayDriver, ApolloGatewayDriverConfig } from '@nestjs/apollo'
import { IntrospectAndCompose } from '@apollo/gateway'

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloGatewayDriverConfig>({
      driver: ApolloGatewayDriver,
      server: {
        playground: true,
        introspection: true,
      },
      gateway: {
        supergraphSdl: new IntrospectAndCompose({
          subgraphs: [
            { name: 'users', url: 'http://localhost:3001/graphql' },
            { name: 'products', url: 'http://localhost:3002/graphql' },
          ],
        }),
      },
    }),
  ],
})
export class AppModule {}
```

## Advanced Federation Patterns

### Entity Relationships

#### One-to-Many Relationship

```typescript
// User has many Products
@Resolver(() => User)
export class UserResolver {
  @ResolveField(() => [Product])
  async products(
    @Parent() user: User,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number
  ): Promise<Product[]> {
    return this.productsService.findByUserId(user.id, { limit })
  }
}
```

#### Many-to-Many Relationship

```typescript
// Product can have multiple categories from another service
@Resolver(() => Product)
export class ProductResolver {
  @ResolveField(() => [Category])
  async categories(@Parent() product: Product): Promise<Category[]> {
    // Return references for the gateway to resolve
    return product.categoryIds.map(id => ({
      __typename: 'Category',
      id
    }))
  }
}
```

### Computed Fields

Add fields that don't exist in the database:

```typescript
@Resolver(() => Product)
export class ProductResolver {
  @ResolveField(() => Boolean)
  inStock(@Parent() product: Product): boolean {
    return product.stock > 0
  }

  @ResolveField(() => String)
  availability(@Parent() product: Product): string {
    if (product.stock === 0) return 'OUT_OF_STOCK'
    if (product.stock < 10) return 'LOW_STOCK'
    return 'IN_STOCK'
  }
}
```

### Federation with Authentication

Pass context through the gateway:

```typescript
// Gateway configuration
gateway: {
  supergraphSdl: new IntrospectAndCompose({
    subgraphs: [/* ... */],
  }),
  buildService({ url }) {
    return new RemoteGraphQLDataSource({
      url,
      willSendRequest({ request, context }) {
        // Forward headers to subgraphs
        request.http.headers.set('authorization', context.req.headers.authorization)
        request.http.headers.set('user-id', context.userId)
      },
    })
  },
}
```

### Custom Directives

Create custom federation directives:

```typescript
@Directive('@custom(reason: "Special handling")')
@Field()
specialField: string
```

## Query Planning

The gateway creates an efficient query plan:

### Example Query

```graphql
query GetUserWithProducts {
  user(id: "123") {
    id
    name
    email
    products {
      id
      name
      price
      stock
    }
  }
}
```

### Query Plan

1. **Fetch from Users Service**:
   ```graphql
   { user(id: "123") { id name email } }
   ```

2. **Fetch from Products Service**:
   ```graphql
   { _entities(representations: [{__typename: "User", id: "123"}]) {
       ... on User { products { id name price stock } }
     }
   }
   ```

3. **Merge Results** into final response

## Performance Optimization

### 1. Implement DataLoader

Prevent N+1 queries in subgraphs:

```typescript
@Injectable()
export class ProductsByUserLoader {
  constructor(private productsService: ProductsService) {}

  createLoader() {
    return new DataLoader<string, Product[]>(async (userIds) => {
      const products = await this.productsService.findByUserIds(userIds)
      
      const productsByUser = new Map<string, Product[]>()
      products.forEach(product => {
        if (!productsByUser.has(product.userId)) {
          productsByUser.set(product.userId, [])
        }
        productsByUser.get(product.userId).push(product)
      })
      
      return userIds.map(id => productsByUser.get(id) || [])
    })
  }
}
```

### 2. Use Field Hints

Provide hints for better query planning:

```typescript
@Field(() => [Product])
@Directive('@requires(fields: "id")')
@Directive('@provides(fields: "product { id name price }")')
products: Product[]
```

### 3. Implement Caching

Cache at the gateway level:

```typescript
import { ApolloServerPluginCacheControl } from '@apollo/server/plugin/cacheControl'

plugins: [
  ApolloServerPluginCacheControl({
    defaultMaxAge: 5,
    calculateHttpHeaders: true,
  }),
]
```

## Error Handling in Federation

### Subgraph Errors

Handle errors gracefully in subgraphs:

```typescript
@ResolveReference()
async resolveReference(reference: { id: string }): Promise<User | null> {
  try {
    return await this.usersService.findOneById(reference.id)
  } catch (error) {
    // Log but don't throw - return null for missing entities
    this.logger.warn(`User ${reference.id} not found`)
    return null
  }
}
```

### Gateway Error Handling

Configure error handling at the gateway:

```typescript
gateway: {
  serviceHealthCheck: true,
  debug: process.env.NODE_ENV !== 'production',
  experimental_pollInterval: 10000,  // Re-poll services every 10s
}
```

## Testing Federation

### Unit Testing Resolvers

```typescript
describe('UserResolver (Federation)', () => {
  it('should resolve reference', async () => {
    const mockUser = { id: '123', name: 'Test' }
    mockUsersService.findOneById.mockResolvedValue(mockUser)

    const result = await resolver.resolveReference({ 
      __typename: 'User', 
      id: '123' 
    })

    expect(result).toEqual(mockUser)
  })
})
```

### Integration Testing

Test the complete federated graph:

```typescript
describe('Federated Graph', () => {
  it('should resolve cross-service query', async () => {
    const query = `
      query {
        user(id: "123") {
          name
          products {
            name
            price
          }
        }
      }
    `

    const response = await request(gateway)
      .post('/graphql')
      .send({ query })

    expect(response.body.data.user).toBeDefined()
    expect(response.body.data.user.products).toBeArray()
  })
})
```

## Best Practices

1. **Keep Entities Thin** - Only include essential fields in entities
2. **Use Reference Resolvers** - Always implement `@ResolveReference`
3. **Avoid Circular Dependencies** - Plan your type extensions carefully
4. **Monitor Performance** - Use Apollo Studio for insights
5. **Version Carefully** - Coordinate schema changes across services
6. **Document Ownership** - Clear ownership of types and fields
7. **Test Federation** - Test cross-service queries thoroughly

## Common Issues and Solutions

### Issue: Entity Not Found

```typescript
// Problem: Gateway can't resolve entity
@ResolveReference()
async resolveReference(ref: { id: string }) {
  // Always handle missing entities gracefully
  const user = await this.usersService.findOneById(ref.id)
  if (!user) {
    this.logger.warn(`User ${ref.id} not found for federation`)
  }
  return user
}
```

### Issue: Field Conflicts

```typescript
// Ensure consistent field types across services
@Field(() => DateTime)  // Same type in all services
createdAt: Date
```

### Issue: Performance Degradation

```typescript
// Use DataLoader for batch loading
@ResolveField()
async user(@Parent() product: Product, @Context() context) {
  return context.userLoader.load(product.userId)
}
```

## Next Steps

- Read [Adding a New Service](./adding-new-service.md) for federation setup
- See [GraphQL Best Practices](./graphql-best-practices.md) for resolver patterns
- Check [Code Generation Guide](./codegen-guide.md) for federation types
- Review [NX Monorepo Guide](./nx-monorepo-guide.md) for project structure