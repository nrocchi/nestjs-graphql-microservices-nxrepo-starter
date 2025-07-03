# NestJS GraphQL Microservices Starter

[![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![GraphQL](https://img.shields.io/badge/-GraphQL-E10098?style=for-the-badge&logo=graphql&logoColor=white)](https://graphql.org/)
[![Apollo-GraphQL](https://img.shields.io/badge/-ApolloGraphQL-311C87?style=for-the-badge&logo=apollo-graphql)](https://www.apollographql.com/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![pnpm](https://img.shields.io/badge/pnpm-%234a4a4a.svg?style=for-the-badge&logo=pnpm&logoColor=f69220)](https://pnpm.io/)

![NestJS](https://img.shields.io/badge/NestJS-v10.4.10-E0234E)
![GraphQL](https://img.shields.io/badge/GraphQL-v16.10.0-E10098)
![Apollo Gateway](https://img.shields.io/badge/Apollo_Gateway-v2.10.0-311C87)
![Apollo Server](https://img.shields.io/badge/Apollo_Server-v4.11.3-311C87)
![Prisma](https://img.shields.io/badge/Prisma-v5.22.0-3982CE)
![TypeScript](https://img.shields.io/badge/TypeScript-v5.8.2-007ACC)
![Node.js](https://img.shields.io/badge/Node.js-18+-43853D)
![NX](https://img.shields.io/badge/NX-v21.2.2-143055)

A production-ready starter template for building GraphQL microservices with NestJS,
featuring Apollo Federation, Prisma, PostgreSQL, Docker, and NX monorepo architecture.

> **🚧 Note**: An authentication-enabled version with JWT tokens, refresh tokens, and role-based access control is
> currently in development and will be available on the `feature/authentication` branch soon.

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Development](#development)
- [API Examples](#api-examples)
- [Configuration](#configuration)
- [Scripts Reference](#scripts-reference)
- [Full API Documentation](#full-api-documentation)

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- Docker & Docker Compose

### Get Started in 3 Steps

```bash
# 1. Clone and enter the project
git clone https://github.com/nrocchi/nestjs-graphql-microservices-nx-repo-starter
cd nestjs-graphql-microservices-nx-repo-starter

# 2. Initialize everything (install, databases, migrations, seed data)
pnpm project:init

# 3. Start all services
pnpm dev
```

### Access GraphQL Playgrounds

- **🌐 API Gateway**: [http://localhost:3000/graphql](http://localhost:3000/graphql) (Federated API)
- **👤 Users Service**: [http://localhost:3001/graphql](http://localhost:3001/graphql)
- **📦 Products Service**: [http://localhost:3002/graphql](http://localhost:3002/graphql)

## Architecture

### System Overview

```text
┌─────────────────┐
│   API Gateway   │ ← Client requests (port 3000)
│ Apollo Federation│
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│ Users  │ │Products│
│Service │ │Service │
│ :3001  │ │ :3002  │
└───┬───┘ └───┬───┘
    │         │
┌───▼───┐ ┌──▼────┐
│Users DB│ │Prod DB│
│ :5432  │ │ :5433 │
└────────┘ └───────┘
```

### Tech Stack

- **🚀 NestJS** - Progressive Node.js framework
- **🔄 Apollo Federation** - Unified GraphQL API gateway
- **🗃️ Prisma ORM** - Type-safe database access
- **🐘 PostgreSQL** - Separate databases per service
- **🐳 Docker** - Containerized development environment
- **📦 NX Monorepo** - Smart build system with caching

### Key Features

- 🔐 **Authentication Ready** - User service with bcrypt password hashing
- 🔄 **GraphQL Federation** - Microservices united under single endpoint
- 📊 **Automatic Seeding** - Pre-populated with 20 users and 20 products
- 🛡️ **Shared Libraries** - Common exceptions and utilities across services
- ⚡ **Hot Reload** - Instant feedback during development
- 🔍 **Type Safety** - Full TypeScript with Prisma generated types

### Monorepo Structure

```text
.
├── apps/
│   ├── api-gateway/        # Apollo Federation gateway
│   ├── users-service/      # Users microservice
│   └── products-service/   # Products microservice
├── libs/
│   └── common/
│       ├── exceptions/     # Shared exception handlers
│       └── utils/         # Shared utilities
└── docker-compose.yml     # Local development setup
```

## Development

### Starting Development

#### Recommended: Using Concurrently

The project uses `concurrently` for optimal development experience:

```bash
pnpm dev  # Starts all services with proper timing
```

This command orchestrates:

```json
"dev": "concurrently \"pnpm start:users\" \"pnpm start:products\" \"sleep 5 && pnpm start:gateway\""
```

**Benefits of concurrently:**

- ⏱️ **Proper startup sequence** - Microservices start first, gateway waits
- 🎨 **Color-coded output** - Each service has its own color
- 🔄 **Unified process** - Stop all with one Ctrl+C
- 📊 **Combined logs** - See everything in one terminal

For debugging individual services:

```bash
pnpm start:gateway    # API Gateway only
pnpm start:users      # Users service only
pnpm start:products   # Products service only
```

### Working with NX

```bash
# Build
nx build api-gateway              # Build specific app
nx run-many --target=build --all  # Build everything

# Test
nx test users-service             # Test specific service
nx affected:test                  # Test only changed code

# Visualize dependencies
nx graph
```

### Using Shared Libraries

```typescript
// Import shared utilities and exceptions
import { ResourceNotFoundException } from '@app/common-exceptions';
import { isValidUUID } from '@app/common-utils';

// Use in your service
if (!isValidUUID(id)) {
  throw new InvalidFormatException('Invalid UUID format');
}
```

### Adding New Features

#### Create a New Service

```bash
nx g @nx/nest:app my-service
```

#### Create a Shared Library

```bash
nx g @nx/js:lib my-lib --directory=libs/shared
```

## API Examples

### Get Users with Their Products

```graphql
query GetUsersWithProducts {
  users {
    id
    name
    email
    products {
      name
      price
      stock
    }
  }
}
```

### Create a New User

```graphql
mutation CreateUser($input: CreateUserInput!) {
  createUser(createUserInput: $input) {
    id
    email
    name
  }
}
```

Variables:

```json
{
  "input": {
    "email": "user@example.com",
    "name": "John Doe",
    "password": "securepassword"
  }
}
```

### Create a Product

```graphql
mutation CreateProduct($input: CreateProductInput!) {
  createProduct(createProductInput: $input) {
    id
    name
    price
    user {
      name
      email
    }
  }
}
```

See [Full API Documentation](#full-api-documentation) for complete reference.

## Configuration

### Environment Variables

Each service uses its own `.env` file (auto-created from `.env.example` during init):

**API Gateway** (`.env`)

```env
PORT=3000
USERS_SERVICE_URL=http://localhost:3001/graphql
PRODUCTS_SERVICE_URL=http://localhost:3002/graphql
```

**Users Service** (`.env`)

```env
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/users_db
```

**Products Service** (`.env`)

```env
PORT=3002
DATABASE_URL=postgresql://user:password@localhost:5433/products_db
USERS_DATABASE_URL=postgresql://user:password@localhost:5432/users_db
```

### Database Management

```bash
# Prisma commands
pnpm prisma:generate:users    # Generate Prisma client
pnpm prisma:migrate:users     # Run migrations
pnpm prisma:studio:users      # Open Prisma Studio GUI

# Docker commands
pnpm docker:up               # Start databases
pnpm docker:down             # Stop databases
```

### Seeding Strategy

The project implements intelligent seeding:

- **Users Service**: Creates 20 users with auto-generated UUIDs
- **Products Service**: Queries Users DB to assign products to real users
- **Referential Integrity**: Always maintained across services

## Scripts Reference

### Development Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all services with concurrently |
| `pnpm start:gateway` | Start API Gateway only |
| `pnpm start:users` | Start Users service only |
| `pnpm start:products` | Start Products service only |

### Build & Test Scripts

| Command | Description |
|---------|-------------|
| `pnpm build` | Build all applications |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all projects |
| `pnpm lint:markdown` | Lint markdown files |
| `pnpm start:all` | Start all services in parallel (alternative to dev) |

### Database Scripts

| Command | Description |
|---------|-------------|
| `pnpm prisma:generate:users` | Generate Prisma client for Users |
| `pnpm prisma:generate:products` | Generate Prisma client for Products |
| `pnpm prisma:migrate:users` | Run Users database migrations |
| `pnpm prisma:migrate:products` | Run Products database migrations |
| `pnpm prisma:seed:users` | Seed Users database |
| `pnpm prisma:seed:products` | Seed Products database |
| `pnpm prisma:seed:all` | Seed all databases |
| `pnpm prisma:studio:users` | Open Prisma Studio for Users (port 5555) |
| `pnpm prisma:studio:products` | Open Prisma Studio for Products (port 5556) |

### Docker Scripts

| Command | Description |
|---------|-------------|
| `pnpm docker:up` | Start Docker containers |
| `pnpm docker:down` | Stop Docker containers |
| `pnpm docker:build` | Build Docker images |

### Utility Scripts

| Command | Description |
|---------|-------------|
| `pnpm project:init` | Complete project setup |
| `pnpm project:reset` | Reset databases and Docker |
| `pnpm lint` | Lint all projects |
| `pnpm test` | Test all projects |

---

## Full API Documentation

<details>
<summary>📖 Click to expand complete API reference</summary>

### Users Service Queries

#### Get All Users

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

#### Get User by ID

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

### Users Service Mutations

#### Create User

```graphql
mutation CreateUser($input: CreateUserInput!) {
  createUser(createUserInput: $input) {
    id
    email
    name
    createdAt
  }
}

# Variables
{
  "input": {
    "email": "user@example.com",
    "name": "John Doe",
    "password": "securepassword123"
  }
}
```

#### Update User

```graphql
mutation UpdateUser($input: UpdateUserInput!) {
  updateUser(updateUserInput: $input) {
    id
    email
    name
    updatedAt
  }
}

# Variables
{
  "input": {
    "id": "user-id-here",
    "name": "Jane Doe",
    "email": "newemail@example.com"
  }
}
```

#### Delete User

```graphql
mutation RemoveUser($id: String!) {
  removeUser(id: $id) {
    id
    email
    name
  }
}
```

### Products Service Queries

#### Get All Products

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

#### Get Product by ID

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

#### Get Products by User

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

### Products Service Mutations

#### Create Product

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

# Variables
{
  "input": {
    "name": "Laptop Pro",
    "description": "High-performance laptop",
    "price": 1299.99,
    "sku": "LAPTOP-001",
    "stock": 50,
    "userId": "user-id-here"
  }
}
```

#### Update Product

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

# Variables
{
  "input": {
    "id": "product-id-here",
    "price": 999.99,
    "stock": 25
  }
}
```

#### Delete Product

```graphql
mutation RemoveProduct($id: String!) {
  removeProduct(id: $id) {
    id
    name
    sku
  }
}
```

### Federated Queries (API Gateway)

#### Users with Products

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

#### Products with Owner

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

#### Complex Federation Query

```graphql
query ComplexFederatedQuery {
  users {
    id
    email
    name
    createdAt
    updatedAt
    products {
      id
      name
      description
      price
      sku
      stock
      createdAt
      updatedAt
    }
  }
  products {
    id
    name
    price
    user {
      id
      email
      name
    }
  }
}
```

</details>

---

## Development Tips

### Prisma Migrations

When modifying database schemas:

```bash
# Generate migration for Users service
cd apps/users-service
npx prisma migrate dev --name add_user_fields

# Generate migration for Products service  
cd apps/products-service
npx prisma migrate dev --name add_product_categories
```

**Best practices:**

- Use descriptive migration names
- Always review generated SQL before applying
- Run `pnpm prisma:generate:*` after migrations

### Debugging

#### Service Issues

- **Check all logs**: `pnpm docker:logs`
- **Individual service logs**: Check color-coded output in terminal
- **Gateway connection errors**: Ensure microservices are running first

#### Database Issues

- **Inspect Users DB**: `pnpm prisma:studio:users` (port 5555)
- **Inspect Products DB**: `pnpm prisma:studio:products` (port 5556)
- **Connection issues**: Verify Docker containers are running with `docker ps`

#### GraphQL Issues

- **Schema conflicts**: Check individual service playgrounds first
- **Federation errors**: Verify `@key` directives match between services
- **Test queries**: Use service-specific playgrounds to isolate issues

### Performance Tips

- **Use NX cache**: `nx reset` to clear cache if needed
- **Selective builds**: `nx affected:build` to build only changed projects
- **Watch mode**: Services auto-reload on code changes
- **Database indexes**: Add indexes for frequently queried fields

## Author

**Nicolas Rocchi**  
<nrocchi@gmail.com>

## License

MIT
