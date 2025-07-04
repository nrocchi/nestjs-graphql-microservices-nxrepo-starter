# GraphQL Code Generator Guide

## Table of Contents

- [Overview](#overview)
  - [What Gets Generated](#what-gets-generated)
- [Prerequisites](#prerequisites)
- [Configuration](#configuration)
- [Running Code Generation](#running-code-generation)
- [Generated Files Overview](#generated-files-overview)
  - [API Gateway](#api-gateway)
  - [Users Service](#users-service)
  - [Products Service](#products-service)
- [Verification and Testing](#verification-and-testing)
  - [1. Verify Generated Files](#1-verify-generated-files)
  - [2. Test TypeScript Integration](#2-test-typescript-integration)
  - [3. Verify Build](#3-verify-build)
- [Usage Examples](#usage-examples)
  - [Using Generated Types in Resolvers](#using-generated-types-in-resolvers)
  - [Using Types in Services](#using-types-in-services)
- [Adding New GraphQL Operations](#adding-new-graphql-operations)
- [Troubleshooting](#troubleshooting)
  - [Services Not Running](#services-not-running)
  - [Type Import Errors](#type-import-errors)
  - [Outdated Types](#outdated-types)
  - [Federation Type Errors](#federation-type-errors)
  - [Prisma Type Mismatch](#prisma-type-mismatch)
- [Best Practices](#best-practices)
- [IDE Tips](#ide-tips)
- [Next Steps](#next-steps)

## Overview

This project uses GraphQL Code Generator to generate TypeScript types from GraphQL schemas automatically. The codegen setup is configured to work with the NestJS code-first approach and Apollo Federation architecture.

### What Gets Generated

1. **Schema files** - GraphQL schema files extracted from running services
2. **TypeScript types** - Type definitions for GraphQL operations
3. **Resolver types** - Typed resolver signatures with proper context and mappers
4. **Federation types** - Apollo Federation specific types (I_Service, IQuery__EntitiesArgs)

## Prerequisites

With the build integration, codegen is handled automatically:

```bash
# This command automatically runs codegen first, then starts services
pnpm dev
```

If you need to run codegen manually, ensure all services are running first:

```bash
# Start them individually
pnpm start:users    # Port 3001
pnpm start:products # Port 3002
pnpm start:gateway  # Port 3000

# Then run codegen
pnpm codegen
```

## Configuration

The codegen configuration is in `codegen.yml` at the project root. Key features:

- **Federation support** - Properly handles Apollo Federation directives
- **Prisma integration** - Maps GraphQL types to Prisma models
- **Custom scalars** - DateTime mapped to string
- **Context typing** - Adds proper typing for resolver context
- **Type prefixes** - Uses 'I' prefix for interfaces (IUser, IProduct)

## Running Code Generation

### Automatic Generation

Code generation is integrated into the build and development workflow:

```bash
# Start services and generate types (first time or after schema changes)
pnpm dev:init

# Start services only (when types already exist)
pnpm dev

# Automatically runs codegen before building
pnpm build

# Start services with continuous type regeneration
pnpm dev:watch
```

### Manual Generation

You can still run codegen manually when needed:

```bash
# Generate types once
pnpm codegen

# Watch mode - regenerates on schema changes
pnpm codegen:watch
```

### Build Integration

The project uses npm lifecycle scripts and smart checks for seamless integration:

```json
{
  "scripts": {
    "prebuild": "./scripts/codegen-if-needed.sh",
    "predev": "./scripts/codegen-if-needed.sh",
    "dev:init": "concurrently \"pnpm start:users\" \"pnpm start:products\" \"sleep 5 && pnpm start:gateway\" \"sleep 10 && pnpm codegen\"",
    "dev:watch": "concurrently \"pnpm codegen:watch\" \"pnpm dev\""
  }
}
```

This ensures:
- Build process always includes latest type definitions
- Development workflow is optimized for both first-time and regular use
- No manual codegen step required in most workflows
- Services have time to start before codegen runs

## Generated Files Overview

All generated files are in `*/generated/` directories and are git-ignored:

### API Gateway
- `apps/api-gateway/src/generated/gateway-schema.graphql` - Complete federated schema
- `apps/api-gateway/src/generated/graphql.ts` - TypeScript types for the gateway

### Users Service
- `apps/users-service/src/generated/users-schema.graphql` - Users service schema
- `apps/users-service/src/generated/graphql.ts` - Typed resolvers with Prisma mappers

### Products Service
- `apps/products-service/src/generated/products-schema.graphql` - Products service schema
- `apps/products-service/src/generated/graphql.ts` - Typed resolvers with Prisma mappers

## Verification and Testing

### 1. Verify Generated Files

```bash
# List all generated files
find . -path "*/generated/*" -type f \( -name "*.ts" -o -name "*.graphql" \) | grep -v node_modules
```

Expected output:
```
./apps/api-gateway/src/generated/gateway-schema.graphql
./apps/api-gateway/src/generated/graphql.ts
./apps/products-service/src/generated/graphql.ts
./apps/products-service/src/generated/products-schema.graphql
./apps/users-service/src/generated/graphql.ts
./apps/users-service/src/generated/users-schema.graphql
```

### 2. Test TypeScript Integration

#### Auto-completion Test
1. Open any resolver file in your IDE
2. Import types: `import { IResolvers } from '../../generated/graphql'`
3. You should see auto-completion for all GraphQL types

#### Type Validation Test
Create a test file to verify types work correctly:

```typescript
// test-types.ts
import { ICreateUserInput } from './apps/users-service/src/generated/graphql'

// ✅ This should work
const validInput: ICreateUserInput = {
  email: 'test@example.com',
  name: 'Test User',
  password: 'password123'
}

// ❌ This should show TypeScript error
const invalidInput: ICreateUserInput = {
  email: 'test@example.com'
  // Missing required fields!
}
```

### 3. Verify Build

```bash
# Build should succeed without type errors
pnpm build

# Run tests
pnpm test
```

## Usage Examples

### Using Generated Types in Resolvers

```typescript
import { IResolvers, IMutationResolvers } from '../../generated/graphql'
import { User as PrismaUser } from '@prisma/client-users'

// Type individual resolver functions
const createUser: IMutationResolvers['createUser'] = async (_, args, context) => {
  // args.createUserInput is fully typed!
  const user = await context.usersService.create(args.createUserInput)
  return toGraphQLUser(user)
}

// Helper to transform Prisma model to GraphQL type
const toGraphQLUser = (user: PrismaUser) => ({
  ...user,
  __typename: 'User' as const
})
```

### Using Types in Services

```typescript
import { ICreateUserInput } from '../../generated/graphql'
import { User as PrismaUser } from '@prisma/client-users'

export class UsersService {
  async create(input: ICreateUserInput): Promise<PrismaUser> {
    // TypeScript ensures input has all required fields
    return this.prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        password: await hash(input.password, 10)
      }
    })
  }
}
```

## Adding New GraphQL Operations

To add new queries or mutations:

1. **Update your resolver** with the new operation
2. **Restart the service** to update the schema
3. **Run codegen** to generate new types
4. **Use the generated types** in your implementation

Example:
```typescript
@Query(() => [User])
async searchUsers(@Args('query') query: string) {
  // After codegen, IQueryResolvers will include 'searchUsers'
  return this.usersService.search(query)
}
```

## Troubleshooting

### Services Not Running
**Error**: `Failed to load schema from http://localhost:300X/graphql`

**Solution**: Ensure all services are running:
```bash
pnpm dev
```

### Type Import Errors
**Error**: `Cannot find module './generated/graphql'`

**Solution**: Run codegen after services are up:
```bash
pnpm codegen
```

### Outdated Types
**Problem**: Types don't reflect recent schema changes

**Solution**:
1. Restart the service that changed
2. Run `pnpm codegen` again
3. Restart TypeScript server in IDE (Cmd/Ctrl + Shift + P → "Restart TS Server")

### Federation Type Errors
**Error**: `Cannot find name 'I_Service'` or `Cannot find name 'IQuery__EntitiesArgs'`

**Solution**: These are imported from `@libs/codegen`. Ensure the import is present in generated files.

### Prisma Type Mismatch
**Error**: Type conflicts between Prisma and GraphQL

**Solution**: Regenerate Prisma clients first:
```bash
pnpm prisma:generate:users
pnpm prisma:generate:products
pnpm codegen
```

## Best Practices

1. **Automatic synchronization** - Use `pnpm dev` or `pnpm dev:watch` for automatic type generation
2. **Use the 'I' prefix convention** - All generated interfaces start with 'I'
3. **Transform at resolver boundary** - Convert Prisma models to GraphQL types in resolvers
4. **Commit generated files to .gitignore** - They're rebuilt from source
5. **CI/CD integration** - The `pnpm build` command automatically includes codegen
6. **Development workflow** - For active development, use `pnpm dev:watch` to keep types in sync
7. **Manual generation** - Run `pnpm codegen` after major schema refactoring

## IDE Tips

- **VS Code**: Install GraphQL extension for syntax highlighting
- **WebStorm**: Built-in GraphQL support
- **Type Navigation**: Cmd/Ctrl + Click on types to see definitions
- **Auto-imports**: Let IDE auto-import from generated files

## Next Steps

- Read [Code Generation Best Practices](./codegen-best-practices.md) for implementation patterns
- See [GraphQL Best Practices](./graphql-best-practices.md) for resolver patterns
- Check [Adding a New Service](./adding-new-service.md) for codegen setup in new services