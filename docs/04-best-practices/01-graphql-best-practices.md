# GraphQL Best Practices

## Table of Contents

- [Overview](#overview)
- [Resolver Architecture](#resolver-architecture)
  - [The Hybrid Approach: NestJS Decorators + Generated Types](#the-hybrid-approach-nestjs-decorators--generated-types)
  - [Benefits of This Approach](#benefits-of-this-approach)
- [Error Handling](#error-handling)
  - [Custom GraphQL Exceptions](#custom-graphql-exceptions)
  - [Error Handling Pattern](#error-handling-pattern)
- [Performance Optimization](#performance-optimization)
  - [N+1 Query Prevention with DataLoader](#n1-query-prevention-with-dataloader)
  - [Query Complexity Analysis](#query-complexity-analysis)
  - [Field-Level Caching](#field-level-caching)
- [Federation Best Practices](#federation-best-practices)
  - [Entity Extension Pattern](#entity-extension-pattern)
  - [Federation Directives](#federation-directives)
- [Security Best Practices](#security-best-practices)
  - [Input Validation](#input-validation)
  - [Rate Limiting](#rate-limiting)
  - [Query Whitelisting](#query-whitelisting)
- [Testing Strategies](#testing-strategies)
  - [Unit Testing Resolvers](#unit-testing-resolvers)
  - [Integration Testing](#integration-testing)
- [Monitoring and Observability](#monitoring-and-observability)
  - [Apollo Studio Integration](#apollo-studio-integration)
  - [Custom Logging](#custom-logging)
- [Schema Design Best Practices](#schema-design-best-practices)
  - [Naming Conventions](#naming-conventions)
  - [Nullability](#nullability)
  - [Pagination](#pagination)
- [Common Pitfalls to Avoid](#common-pitfalls-to-avoid)
- [Next Steps](#next-steps)

## Overview

This guide covers best practices for implementing GraphQL APIs with NestJS, including resolver patterns, error handling, performance optimization, and testing strategies.

## Resolver Architecture

### The Hybrid Approach: NestJS Decorators + Generated Types

Combine the power of NestJS decorators with the type safety of generated types:

```typescript
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql'
import { UseGuards, UseInterceptors } from '@nestjs/common'
import { IUser, ICreateUserInput, IMutationResolvers } from '../../generated/graphql'

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => [User], { name: 'users' })
  @UseGuards(AuthGuard)  // NestJS features
  async findAll(): Promise<IUser[]> {  // Generated return type
    const users = await this.usersService.findAll()
    return users.map(this.toGraphQLUser)
  }

  @Mutation(() => User)
  async createUser(
    @Args('createUserInput') input: ICreateUserInput  // Generated input type
  ): ReturnType<IMutationResolvers['createUser']> {
    const user = await this.usersService.create(input)
    return this.toGraphQLUser(user)
  }
}
```

### Benefits of This Approach

1. ✅ **Full NestJS ecosystem**: Guards, Interceptors, Pipes, Dependency Injection
2. ✅ **Complete type safety**: Generated types ensure schema compliance
3. ✅ **Better developer experience**: IDE support + NestJS features
4. ✅ **Easy testing**: Typed mocks and stubs
5. ✅ **Gradual migration**: Can adopt types incrementally

## Error Handling

### Custom GraphQL Exceptions

Create domain-specific exceptions that integrate with GraphQL:

```typescript
import { GraphQLError } from 'graphql'

export class GraphQLBusinessError extends GraphQLError {
  constructor(
    message: string,
    code: string,
    statusCode: number = 400,
    details?: Record<string, any>
  ) {
    super(message, {
      extensions: {
        code,
        statusCode,
        timestamp: new Date().toISOString(),
        ...details
      }
    })
  }
}

// Usage
throw new GraphQLBusinessError(
  'Email already exists',
  'DUPLICATE_EMAIL',
  409,
  { field: 'email' }
)
```

### Error Handling Pattern

```typescript
@Mutation(() => User)
async createUser(@Args('input') input: ICreateUserInput) {
  try {
    // Validation
    if (!isValidEmail(input.email)) {
      throw new ValidationError('Invalid email format')
    }

    // Business logic check
    const existing = await this.usersService.findByEmail(input.email)
    if (existing) {
      throw new ConflictError('Email already exists')
    }

    // Create user
    return await this.usersService.create(input)
    
  } catch (error) {
    // Log internal errors
    if (!(error instanceof GraphQLBusinessError)) {
      this.logger.error('Unexpected error', error)
      throw new InternalServerError('An unexpected error occurred')
    }
    throw error
  }
}
```

## Performance Optimization

### N+1 Query Prevention with DataLoader

```typescript
import DataLoader from 'dataloader'

@Injectable()
export class UserLoader {
  constructor(private usersService: UsersService) {}

  createLoader(): DataLoader<string, User> {
    return new DataLoader(async (userIds: string[]) => {
      const users = await this.usersService.findByIds(userIds)
      const userMap = new Map(users.map(user => [user.id, user]))
      return userIds.map(id => userMap.get(id))
    })
  }
}

// In resolver
@ResolveField(() => User)
async user(@Parent() product: Product, @Context() context) {
  return context.userLoader.load(product.userId)
}
```

### Query Complexity Analysis

```typescript
import { GraphQLModule } from '@nestjs/graphql'
import depthLimit from 'graphql-depth-limit'
import costAnalysis from 'graphql-cost-analysis'

GraphQLModule.forRoot({
  validationRules: [
    depthLimit(5),  // Max query depth
    costAnalysis({
      maximumCost: 1000,
      defaultCost: 1,
      variables: {},
      createError: (max, actual) => {
        return new Error(`Query exceeded maximum cost of ${max}. Actual cost: ${actual}`)
      }
    })
  ]
})
```

### Field-Level Caching

```typescript
import { CacheControl } from '@nestjs/graphql'

@Query(() => [Product])
@CacheControl({ maxAge: 60 })  // Cache for 60 seconds
async products() {
  return this.productsService.findAll()
}

@Query(() => User)
@CacheControl({ maxAge: 0, scope: 'PRIVATE' })  // Don't cache user data
async me(@CurrentUser() user: User) {
  return user
}
```

## Federation Best Practices

### Entity Extension Pattern

```typescript
// In Products service - extending User entity
@Resolver(() => User)
export class UserResolver {
  @ResolveField(() => [Product])
  async products(@Parent() user: User) {
    // Only fetch when requested
    return this.productsService.findByUserId(user.id)
  }

  @ResolveReference()
  async resolveReference(reference: { __typename: string; id: string }) {
    // Minimal data for federation
    return { id: reference.id, __typename: 'User' }
  }
}
```

### Federation Directives

```typescript
@ObjectType()
@Directive('@key(fields: "id")')
export class User {
  @Field(() => ID)
  id: string

  @Field()
  email: string

  // This field is resolved by another service
  @Field(() => [Product])
  @Directive('@external')
  products?: Product[]
}
```

## Security Best Practices

### Input Validation

```typescript
import { IsEmail, Length, IsUUID } from 'class-validator'

@InputType()
export class CreateUserInput {
  @Field()
  @IsEmail()
  email: string

  @Field()
  @Length(2, 50)
  name: string

  @Field()
  @Length(8, 100)
  password: string
}

// In resolver
@UsePipes(new ValidationPipe({ transform: true }))
@Mutation(() => User)
async createUser(@Args('input') input: CreateUserInput) {
  // Input is automatically validated
}
```

### Rate Limiting

```typescript
import { ThrottlerGuard } from '@nestjs/throttler'

@Resolver()
@UseGuards(ThrottlerGuard)
export class PublicResolver {
  @Query(() => [Product])
  @Throttle(10, 60)  // 10 requests per minute
  async searchProducts(@Args('query') query: string) {
    return this.productsService.search(query)
  }
}
```

### Query Whitelisting

```typescript
// For production
GraphQLModule.forRoot({
  playground: false,
  introspection: false,
  persistedQueries: {
    cache: new InMemoryLRUCache({ maxSize: 1000 })
  },
  // Only allow pre-approved queries
  validationRules: [
    require('graphql-query-whitelist')({
      whitelist: loadWhitelistedQueries()
    })
  ]
})
```

## Testing Strategies

### Unit Testing Resolvers

```typescript
import { Test } from '@nestjs/testing'
import { ICreateUserInput, IUser } from '../../generated/graphql'

describe('UsersResolver', () => {
  let resolver: UsersResolver
  let service: MockUsersService

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersResolver,
        {
          provide: UsersService,
          useValue: createMockUsersService()
        }
      ]
    }).compile()

    resolver = module.get(UsersResolver)
    service = module.get(UsersService)
  })

  it('should create user with valid input', async () => {
    const input: ICreateUserInput = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123'
    }

    const expectedUser: IUser = {
      id: '123',
      ...input,
      __typename: 'User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    service.create.mockResolvedValue(expectedUser)

    const result = await resolver.createUser(input)
    expect(result).toEqual(expectedUser)
  })
})
```

### Integration Testing

```typescript
import { INestApplication } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import request from 'supertest'

describe('GraphQL Integration', () => {
  let app: INestApplication

  beforeAll(async () => {
    // Create app with real GraphQL setup
    app = await createTestApp()
  })

  it('should execute federated query', async () => {
    const query = `
      query {
        users {
          id
          name
          products {
            id
            name
            price
          }
        }
      }
    `

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query })
      .expect(200)

    expect(response.body.data.users).toBeDefined()
    expect(response.body.errors).toBeUndefined()
  })
})
```

## Monitoring and Observability

### Apollo Studio Integration

```typescript
import { ApolloServerPluginUsageReporting } from '@apollo/server/plugin/usageReporting'

GraphQLModule.forRoot({
  plugins: [
    ApolloServerPluginUsageReporting({
      sendVariableValues: { all: true },
      sendHeaders: { all: true }
    })
  ]
})
```

### Custom Logging

```typescript
@Injectable()
export class GraphQLLogger implements GraphQLPlugin {
  requestDidStart() {
    return {
      willSendResponse(context) {
        const { response, request } = context
        
        // Log queries with timing
        logger.info('GraphQL Request', {
          query: request.query,
          variables: request.variables,
          duration: response.http.body.extensions?.duration,
          errors: response.http.body.errors
        })
      }
    }
  }
}
```

## Schema Design Best Practices

### Naming Conventions

```graphql
# Good naming
type User {
  id: ID!
  email: String!
  createdAt: DateTime!  # Not "created_at" or "dateCreated"
}

input CreateUserInput {  # Not "UserCreateInput" or "NewUser"
  email: String!
  name: String!
}

type Query {
  user(id: ID!): User  # Singular for single item
  users: [User!]!      # Plural for lists
}

type Mutation {
  createUser(input: CreateUserInput!): User!  # Verb + Noun
  updateUser(input: UpdateUserInput!): User!
  deleteUser(id: ID!): User!
}
```

### Nullability

```graphql
type User {
  id: ID!              # Never null
  email: String!       # Required field
  bio: String          # Optional field
  posts: [Post!]!      # List never null, items never null
  friends: [User!]     # List can be null, items never null
}
```

### Pagination

```graphql
type UserConnection {
  edges: [UserEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type UserEdge {
  node: User!
  cursor: String!
}

type Query {
  users(
    first: Int
    after: String
    last: Int
    before: String
  ): UserConnection!
}
```

## Common Pitfalls to Avoid

1. **Don't expose database IDs directly** - Use opaque IDs or UUIDs
2. **Don't return null for lists** - Return empty arrays instead
3. **Don't design around current UI** - Design for API longevity
4. **Don't ignore deprecation** - Mark old fields with @deprecated
5. **Don't skip error boundaries** - Always handle errors gracefully

## Next Steps

- Read [Code Generation Guide](./codegen-guide.md) for type generation setup
- See [Code Generation Best Practices](./codegen-best-practices.md) for implementation patterns
- Check [Federation Guide](./graphql-federation-guide.md) for distributed schemas
- Review [Adding a New Service](./adding-new-service.md) for service setup