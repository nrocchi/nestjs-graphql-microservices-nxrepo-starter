# Adding a New Library

## Table of Contents

- [Overview](#overview)
- [Types of Libraries](#types-of-libraries)
  - [1. Feature Libraries](#1-feature-libraries)
  - [2. Data Access Libraries](#2-data-access-libraries)
  - [3. Utility Libraries](#3-utility-libraries)
  - [4. UI Libraries](#4-ui-libraries)
- [Creating a New Library](#creating-a-new-library)
  - [Basic Library Generation](#basic-library-generation)
  - [Library Structure](#library-structure)
- [Step-by-Step: Creating a Validation Library](#step-by-step-creating-a-validation-library)
  - [1. Generate the Library](#1-generate-the-library)
  - [2. Configure TypeScript Path](#2-configure-typescript-path)
  - [3. Implement Library Code](#3-implement-library-code)
  - [4. Export Public API](#4-export-public-api)
  - [5. Add Unit Tests](#5-add-unit-tests)
  - [6. Use the Library](#6-use-the-library)
- [Library Types and Patterns](#library-types-and-patterns)
  - [1. Exception Library](#1-exception-library)
  - [2. Configuration Library](#2-configuration-library)
  - [3. Testing Utilities Library](#3-testing-utilities-library)
- [Library Configuration](#library-configuration)
  - [Project.json Options](#projectjson-options)
  - [Using Tags for Boundaries](#using-tags-for-boundaries)
- [Testing Libraries](#testing-libraries)
  - [Run Library Tests](#run-library-tests)
  - [Integration Testing](#integration-testing)
- [Best Practices](#best-practices)
  - [1. Keep Libraries Focused](#1-keep-libraries-focused)
  - [2. Define Clear Public APIs](#2-define-clear-public-apis)
  - [3. Document Library Usage](#3-document-library-usage)
  - [4. Version Libraries (if publishable)](#4-version-libraries-if-publishable)
  - [5. Use Consistent Naming](#5-use-consistent-naming)
- [Common Issues](#common-issues)
  - [Circular Dependencies](#circular-dependencies)
  - [Build Order](#build-order)
  - [Type Imports](#type-imports)
- [Next Steps](#next-steps)

This guide explains how to create and configure shared libraries in the NX monorepo architecture.

## Overview

Libraries in NX are shared packages that can be used across multiple applications. They promote code reuse, maintain consistency, and enforce architectural boundaries.

## Types of Libraries

### 1. Feature Libraries
Contain business logic and UI components specific to a feature.

### 2. Data Access Libraries
Handle data fetching, state management, and API communication.

### 3. Utility Libraries
Provide shared utilities, helpers, and common functions.

### 4. UI Libraries
Contain presentational components and design system elements.

## Creating a New Library

### Basic Library Generation

```bash
# Generate a TypeScript library
nx g @nx/js:lib my-lib --directory=libs/shared

# Generate a NestJS library
nx g @nx/nest:lib my-nest-lib --directory=libs/backend

# Generate with specific options
nx g @nx/js:lib my-utils \
  --directory=libs/common \
  --tags="scope:shared,type:util" \
  --publishable \
  --importPath="@app/my-utils"
```

### Library Structure

After generation, your library structure will look like:

```
libs/
└── common/
    └── my-utils/
        ├── src/
        │   ├── index.ts          # Public API
        │   └── lib/
        │       └── my-utils.ts   # Implementation
        ├── project.json          # NX project configuration
        ├── tsconfig.json         # TypeScript config
        ├── tsconfig.lib.json     # Library-specific TS config
        ├── jest.config.ts        # Jest configuration
        └── README.md             # Library documentation
```

## Step-by-Step: Creating a Validation Library

Let's create a shared validation library as an example:

### 1. Generate the Library

```bash
nx g @nx/js:lib validation \
  --directory=libs/common \
  --tags="scope:shared,type:util" \
  --importPath="@app/validation"
```

### 2. Configure TypeScript Path

The generator automatically adds the path mapping to `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@app/validation": ["libs/common/validation/src/index.ts"]
    }
  }
}
```

### 3. Implement Library Code

Create validation utilities in `libs/common/validation/src/lib/`:

```typescript
// validation.ts
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export function isValidPassword(password: string): boolean {
  // At least 8 characters, one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
  return passwordRegex.test(password)
}

// Custom validators for business logic
export function isValidProductSKU(sku: string): boolean {
  // Format: XXX-000-XXX (letters-numbers-letters)
  const skuRegex = /^[A-Z]{3}-\d{3}-[A-Z]{3}$/
  return skuRegex.test(sku)
}
```

### 4. Export Public API

Update `libs/common/validation/src/index.ts`:

```typescript
export * from './lib/validation'

// You can also export specific items
export { isValidEmail, isValidUUID } from './lib/validation'
```

### 5. Add Unit Tests

Create `libs/common/validation/src/lib/validation.spec.ts`:

```typescript
import { isValidEmail, isValidUUID, isValidPassword } from './validation'

describe('Validation Utils', () => {
  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      expect(isValidEmail('user@example.com')).toBe(true)
      expect(isValidEmail('user.name+tag@example.co.uk')).toBe(true)
    })

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
      expect(isValidEmail('user@')).toBe(false)
    })
  })

  describe('isValidUUID', () => {
    it('should validate v4 UUIDs', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
    })

    it('should reject invalid UUIDs', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false)
      expect(isValidUUID('550e8400-e29b-11d4-a716-446655440000')).toBe(false) // v1 UUID
    })
  })
})
```

### 6. Use the Library

In any application or other library:

```typescript
import { isValidEmail, isValidUUID } from '@app/validation'

@Injectable()
export class UsersService {
  async create(input: CreateUserInput) {
    // Use validation utilities
    if (!isValidEmail(input.email)) {
      throw new ValidationException('Invalid email format')
    }

    // Continue with creation...
  }

  async findOne(id: string) {
    if (!isValidUUID(id)) {
      throw new InvalidFormatException('Invalid user ID format')
    }

    return this.prisma.user.findUnique({ where: { id } })
  }
}
```

## Library Types and Patterns

### 1. Exception Library

```bash
nx g @nx/js:lib exceptions --directory=libs/common
```

```typescript
// libs/common/exceptions/src/lib/exceptions.ts
export class BaseException extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number
  ) {
    super(message)
    this.name = this.constructor.name
  }
}

export class ValidationException extends BaseException {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400)
  }
}

export class NotFoundException extends BaseException {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404)
  }
}
```

### 2. Configuration Library

```bash
nx g @nx/js:lib config --directory=libs/shared
```

```typescript
// libs/shared/config/src/lib/config.ts
export interface DatabaseConfig {
  host: string
  port: number
  database: string
  username: string
  password: string
}

export interface AppConfig {
  port: number
  environment: 'development' | 'production' | 'test'
  database: DatabaseConfig
}

export function loadConfig(): AppConfig {
  return {
    port: parseInt(process.env.PORT || '3000', 10),
    environment: process.env.NODE_ENV as any || 'development',
    database: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'myapp',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    }
  }
}
```

### 3. Testing Utilities Library

```bash
nx g @nx/js:lib testing --directory=libs/common
```

```typescript
// libs/common/testing/src/lib/mocks.ts
export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }
}

export function createMockPrismaService() {
  return {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn()
    }
  }
}
```

## Library Configuration

### Project.json Options

```json
{
  "name": "validation",
  "sourceRoot": "libs/common/validation/src",
  "projectType": "library",
  "targets": {
    "build": {
      "executor": "@nx/js:tsc",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/libs/common/validation",
        "main": "libs/common/validation/src/index.ts",
        "tsConfig": "libs/common/validation/tsconfig.lib.json",
        "assets": ["libs/common/validation/*.md"]
      }
    },
    "test": {
      "executor": "@nx/jest:jest",
      "outputs": ["{workspaceRoot}/coverage/{projectRoot}"],
      "options": {
        "jestConfig": "libs/common/validation/jest.config.ts"
      }
    },
    "lint": {
      "executor": "@nx/eslint:lint"
    }
  },
  "tags": ["scope:shared", "type:util"]
}
```

### Using Tags for Boundaries

Tags help enforce architectural constraints:

```json
// .eslintrc.json
{
  "overrides": [
    {
      "files": ["*.ts", "*.tsx"],
      "rules": {
        "@nx/enforce-module-boundaries": [
          "error",
          {
            "depConstraints": [
              {
                "sourceTag": "scope:backend",
                "onlyDependOnLibsWithTags": ["scope:shared", "scope:backend"]
              },
              {
                "sourceTag": "scope:shared",
                "onlyDependOnLibsWithTags": ["scope:shared"]
              }
            ]
          }
        ]
      }
    }
  ]
}
```

## Testing Libraries

### Run Library Tests

```bash
# Test specific library
nx test validation

# Test with coverage
nx test validation --coverage

# Test in watch mode
nx test validation --watch
```

### Integration Testing

Test how libraries work together:

```typescript
import { isValidEmail } from '@app/validation'
import { ValidationException } from '@app/exceptions'

describe('Library Integration', () => {
  it('should throw ValidationException for invalid email', () => {
    const invalidEmail = 'not-an-email'
    
    if (!isValidEmail(invalidEmail)) {
      expect(() => {
        throw new ValidationException('Invalid email')
      }).toThrow(ValidationException)
    }
  })
})
```

## Best Practices

### 1. Keep Libraries Focused
Each library should have a single, clear purpose.

### 2. Define Clear Public APIs
Only export what consumers need:

```typescript
// index.ts - be explicit about exports
export { isValidEmail, isValidUUID } from './lib/validation'
// Don't export internal helpers
```

### 3. Document Library Usage

Create a README.md for each library:

```markdown
# Validation Library

Shared validation utilities for the monorepo.

## Installation

This library is available at `@app/validation`.

## Usage

\```typescript
import { isValidEmail } from '@app/validation'

if (!isValidEmail(email)) {
  throw new Error('Invalid email')
}
\```

## Available Functions

- `isValidEmail(email: string): boolean`
- `isValidUUID(uuid: string): boolean`
- `isValidPassword(password: string): boolean`
```

### 4. Version Libraries (if publishable)

For publishable libraries:

```bash
nx g @nx/js:lib my-public-lib --publishable --importPath="@myorg/my-public-lib"
```

### 5. Use Consistent Naming

- `libs/common/*` - Shared across all apps
- `libs/backend/*` - Backend-specific libraries
- `libs/frontend/*` - Frontend-specific libraries
- `libs/shared/*` - Business logic libraries

## Common Issues

### Circular Dependencies

Avoid by:
- Keep libraries focused
- Use dependency inversion
- Create interface libraries

### Build Order

NX automatically determines build order based on dependencies.

### Type Imports

Always use type imports when possible:

```typescript
import type { User } from '@app/interfaces'
```

## Next Steps

- See [NX Monorepo Guide](./nx-monorepo-guide.md) for workspace organization
- Check [GraphQL Best Practices](./graphql-best-practices.md) for using libraries in resolvers
- Read [Adding a New Service](./adding-new-service.md) for service-specific libraries