# Complete API Documentation

This document provides a comprehensive reference for all GraphQL operations available in the NestJS GraphQL Microservices system.

## Table of Contents

- [Service Endpoints](#service-endpoints)
- [Users Service API](#users-service-api)
  - [Queries](#users-service-queries)
  - [Mutations](#users-service-mutations)
  - [Types](#users-service-types)
- [Products Service API](#products-service-api)
  - [Queries](#products-service-queries)
  - [Mutations](#products-service-mutations)
  - [Types](#products-service-types)
- [Federated API (Gateway)](#federated-api-gateway)
  - [Cross-Service Queries](#cross-service-queries)
  - [Federation Examples](#federation-examples)
- [Error Handling](#error-handling)
- [Authentication](#authentication)

## Service Endpoints

| Service | GraphQL Endpoint | Playground URL |
|---------|------------------|----------------|
| API Gateway (Federated) | `http://localhost:3000/graphql` | [http://localhost:3000/graphql](http://localhost:3000/graphql) |
| Users Service | `http://localhost:3001/graphql` | [http://localhost:3001/graphql](http://localhost:3001/graphql) |
| Products Service | `http://localhost:3002/graphql` | [http://localhost:3002/graphql](http://localhost:3002/graphql) |

## Users Service API

### Users Service Queries

#### Get All Users

Retrieves a list of all users in the system.

```graphql
query GetAllUsers {
  users {
    id
    email
    name
    createdAt
    updatedAt
  }
}
```

**Response:**
```json
{
  "data": {
    "users": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "user@example.com",
        "name": "John Doe",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

#### Get User by ID

Retrieves a specific user by their unique identifier.

```graphql
query GetUser($id: String!) {
  user(id: $id) {
    id
    email
    name
    createdAt
    updatedAt
  }
}
```

**Variables:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Users Service Mutations

#### Create User

Creates a new user account with email and password.

```graphql
mutation CreateUser($input: CreateUserInput!) {
  createUser(createUserInput: $input) {
    id
    email
    name
    createdAt
  }
}
```

**Variables:**
```json
{
  "input": {
    "email": "newuser@example.com",
    "name": "Jane Smith",
    "password": "securepassword123"
  }
}
```

**Response:**
```json
{
  "data": {
    "createUser": {
      "id": "650e8400-e29b-41d4-a716-446655440001",
      "email": "newuser@example.com",
      "name": "Jane Smith",
      "createdAt": "2024-01-02T00:00:00.000Z"
    }
  }
}
```

#### Update User

Updates an existing user's information.

```graphql
mutation UpdateUser($input: UpdateUserInput!) {
  updateUser(updateUserInput: $input) {
    id
    email
    name
    updatedAt
  }
}
```

**Variables:**
```json
{
  "input": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Updated",
    "email": "newemail@example.com"
  }
}
```

**Note:** All fields except `id` are optional in the update input.

#### Remove User

Deletes a user from the system.

```graphql
mutation RemoveUser($id: String!) {
  removeUser(id: $id) {
    id
    email
    name
  }
}
```

**Variables:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Users Service Types

#### User Type

```graphql
type User {
  id: ID!
  email: String!
  name: String!
  password: String! # Hashed, not returned in queries
  createdAt: DateTime!
  updatedAt: DateTime!
  products: [Product!]! # Available through federation
}
```

#### CreateUserInput

```graphql
input CreateUserInput {
  email: String!
  name: String!
  password: String!
}
```

#### UpdateUserInput

```graphql
input UpdateUserInput {
  id: String!
  email: String
  name: String
  password: String
}
```

## Products Service API

### Products Service Queries

#### Get All Products

Retrieves all products in the catalog.

```graphql
query GetAllProducts {
  products {
    id
    name
    description
    price
    sku
    stock
    userId
    createdAt
    updatedAt
  }
}
```

**Response:**
```json
{
  "data": {
    "products": [
      {
        "id": "750e8400-e29b-41d4-a716-446655440002",
        "name": "Laptop Pro",
        "description": "High-performance laptop",
        "price": 1299.99,
        "sku": "LAPTOP-001",
        "stock": 50,
        "userId": "550e8400-e29b-41d4-a716-446655440000",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

#### Get Product by ID

Retrieves a specific product by its identifier.

```graphql
query GetProduct($id: String!) {
  product(id: $id) {
    id
    name
    description
    price
    sku
    stock
    userId
    createdAt
    updatedAt
  }
}
```

**Variables:**
```json
{
  "id": "750e8400-e29b-41d4-a716-446655440002"
}
```

#### Get Products by User

Retrieves all products owned by a specific user.

```graphql
query GetProductsByUser($userId: String!) {
  productsByUser(userId: $userId) {
    id
    name
    description
    price
    sku
    stock
    createdAt
  }
}
```

**Variables:**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Products Service Mutations

#### Create Product

Creates a new product in the catalog.

```graphql
mutation CreateProduct($input: CreateProductInput!) {
  createProduct(createProductInput: $input) {
    id
    name
    description
    price
    sku
    stock
    userId
    createdAt
  }
}
```

**Variables:**
```json
{
  "input": {
    "name": "Smartphone X",
    "description": "Latest model smartphone with advanced features",
    "price": 999.99,
    "sku": "PHONE-X-001",
    "stock": 100,
    "userId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

#### Update Product

Updates an existing product's information.

```graphql
mutation UpdateProduct($input: UpdateProductInput!) {
  updateProduct(updateProductInput: $input) {
    id
    name
    description
    price
    sku
    stock
    updatedAt
  }
}
```

**Variables:**
```json
{
  "input": {
    "id": "750e8400-e29b-41d4-a716-446655440002",
    "price": 899.99,
    "stock": 75,
    "description": "Updated description"
  }
}
```

#### Remove Product

Deletes a product from the catalog.

```graphql
mutation RemoveProduct($id: String!) {
  removeProduct(id: $id) {
    id
    name
    sku
  }
}
```

**Variables:**
```json
{
  "id": "750e8400-e29b-41d4-a716-446655440002"
}
```

### Products Service Types

#### Product Type

```graphql
type Product {
  id: ID!
  name: String!
  description: String
  price: Float!
  sku: String!
  stock: Int!
  userId: String!
  createdAt: DateTime!
  updatedAt: DateTime!
  user: User! # Available through federation
}
```

#### CreateProductInput

```graphql
input CreateProductInput {
  name: String!
  description: String
  price: Float!
  sku: String!
  stock: Int!
  userId: String!
}
```

#### UpdateProductInput

```graphql
input UpdateProductInput {
  id: String!
  name: String
  description: String
  price: Float
  sku: String
  stock: Int
  userId: String
}
```

## Federated API (Gateway)

The API Gateway provides a unified GraphQL endpoint that combines all microservices through Apollo Federation.

### Cross-Service Queries

#### Users with Their Products

This query demonstrates federation by fetching users and their associated products in a single request.

```graphql
query GetUsersWithTheirProducts {
  users {
    id
    email
    name
    products {
      id
      name
      price
      stock
      sku
    }
  }
}
```

**Response:**
```json
{
  "data": {
    "users": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "user@example.com",
        "name": "John Doe",
        "products": [
          {
            "id": "750e8400-e29b-41d4-a716-446655440002",
            "name": "Laptop Pro",
            "price": 1299.99,
            "stock": 50,
            "sku": "LAPTOP-001"
          }
        ]
      }
    ]
  }
}
```

#### Products with Owner Information

Fetches products along with their owner's details.

```graphql
query GetProductsWithOwners {
  products {
    id
    name
    description
    price
    stock
    user {
      id
      email
      name
    }
  }
}
```

### Federation Examples

#### Complex Federated Query

This example shows how to leverage federation for complex data requirements:

```graphql
query ComplexFederatedQuery($userId: String!, $minPrice: Float) {
  # Get specific user with all their products
  user(id: $userId) {
    id
    email
    name
    createdAt
    products {
      id
      name
      price
      stock
      description
    }
  }
  
  # Get all products above a certain price
  products {
    id
    name
    price
    stock
    user {
      id
      name
      email
    }
  }
}
```

**Variables:**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "minPrice": 100.00
}
```

#### Nested Federation Query

Demonstrates deep nesting capabilities:

```graphql
query DeepFederationQuery {
  users {
    id
    name
    email
    products {
      id
      name
      price
      description
      user {
        id
        name
        email
      }
    }
  }
}
```

## Error Handling

The API uses standard GraphQL error responses with custom exception types:

### Common Error Responses

#### Resource Not Found

```json
{
  "errors": [
    {
      "message": "User with ID 'invalid-id' not found",
      "extensions": {
        "code": "RESOURCE_NOT_FOUND",
        "statusCode": 404
      }
    }
  ]
}
```

#### Invalid Input

```json
{
  "errors": [
    {
      "message": "Invalid UUID format",
      "extensions": {
        "code": "INVALID_FORMAT",
        "statusCode": 400
      }
    }
  ]
}
```

#### Validation Error

```json
{
  "errors": [
    {
      "message": "Validation failed",
      "extensions": {
        "code": "BAD_USER_INPUT",
        "statusCode": 400,
        "validationErrors": [
          {
            "field": "email",
            "message": "Invalid email format"
          }
        ]
      }
    }
  ]
}
```

### Exception Types

- `ResourceNotFoundException` - When a requested resource doesn't exist
- `InvalidFormatException` - When input format is invalid (e.g., UUID)
- `ValidationException` - When input validation fails
- `ConflictException` - When operation would create a conflict (e.g., duplicate email)

## Authentication

> **Note:** Authentication is currently in development on the `feature/authentication` branch.

### Planned Authentication Features

1. **JWT Token Authentication**
   - Access tokens with configurable expiration
   - Refresh token rotation
   - Secure token storage recommendations

2. **Role-Based Access Control (RBAC)**
   - User roles: Admin, User, Guest
   - Permission-based field resolution
   - Query/Mutation level authorization

3. **Protected Operations**
   - Public queries (read operations)
   - Protected mutations (require authentication)
   - Admin-only operations

### Future Authentication Examples

```graphql
# Login mutation (coming soon)
mutation Login($credentials: LoginInput!) {
  login(credentials: $credentials) {
    accessToken
    refreshToken
    user {
      id
      email
      name
      role
    }
  }
}

# Protected query with auth header
query GetMyProfile {
  me {
    id
    email
    name
    products {
      id
      name
    }
  }
}
```

## Best Practices

### Query Optimization

1. **Request only needed fields**
   ```graphql
   # Good - specific fields
   query { users { id name } }
   
   # Avoid - requesting everything
   query { users { id name email createdAt updatedAt } }
   ```

2. **Use variables for dynamic values**
   ```graphql
   # Good
   query GetUser($id: String!) {
     user(id: $id) { name }
   }
   
   # Avoid
   query {
     user(id: "hardcoded-id") { name }
   }
   ```

3. **Batch related queries**
   ```graphql
   # Good - single request
   query {
     user(id: $id) {
       name
       products { name price }
     }
   }
   
   # Avoid - multiple requests
   query { user(id: $id) { name } }
   query { productsByUser(userId: $id) { name price } }
   ```

### Mutation Patterns

1. **Return updated data**
   ```graphql
   mutation UpdateUser($input: UpdateUserInput!) {
     updateUser(updateUserInput: $input) {
       id
       name
       email
       updatedAt
     }
   }
   ```

2. **Handle errors gracefully**
   - Check for validation errors
   - Handle not found scenarios
   - Implement proper retry logic

3. **Use descriptive names**
   - Clear mutation names: `createUser`, not `newUser`
   - Consistent naming: `removeUser`, not `deleteUser` in one service and `removeProduct` in another