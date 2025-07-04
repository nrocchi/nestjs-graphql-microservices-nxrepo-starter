# NX Monorepo Guide

## Table of Contents

- [Overview](#overview)
- [Core Concepts](#core-concepts)
  - [Workspace Structure](#workspace-structure)
  - [Mental Model](#mental-model)
- [Essential NX Commands](#essential-nx-commands)
  - [Development](#development)
  - [Building](#building)
  - [Testing](#testing)
  - [Linting](#linting)
- [Dependency Graph](#dependency-graph)
  - [Visualize Dependencies](#visualize-dependencies)
  - [Understanding Dependencies](#understanding-dependencies)
- [Affected Commands](#affected-commands)
- [Computation Caching](#computation-caching)
  - [Local Caching](#local-caching)
  - [Cache Configuration](#cache-configuration)
  - [Distributed Caching with Nx Cloud](#distributed-caching-with-nx-cloud)
- [Task Orchestration](#task-orchestration)
  - [Run Tasks in Parallel](#run-tasks-in-parallel)
  - [Custom Task Pipelines](#custom-task-pipelines)
- [Generators](#generators)
  - [Using Built-in Generators](#using-built-in-generators)
  - [Custom Generators](#custom-generators)
- [Module Boundaries](#module-boundaries)
  - [Enforce Constraints](#enforce-constraints)
  - [Tag Projects](#tag-projects)
- [Performance Optimization](#performance-optimization)
  - [1. Use Computation Caching](#1-use-computation-caching)
  - [2. Incremental Builds](#2-incremental-builds)
  - [3. Parallel Execution](#3-parallel-execution)
  - [4. Affected Only in CI](#4-affected-only-in-ci)
- [Common Patterns](#common-patterns)
  - [Shared Configuration](#shared-configuration)
  - [Environment-Specific Builds](#environment-specific-builds)
  - [Workspace Libraries Pattern](#workspace-libraries-pattern)
- [Troubleshooting](#troubleshooting)
  - [Clear Cache Issues](#clear-cache-issues)
  - [Circular Dependencies](#circular-dependencies)
  - [Out of Memory](#out-of-memory)
  - [Module Resolution](#module-resolution)
- [CI/CD Integration](#cicd-integration)
  - [GitHub Actions Example](#github-actions-example)
  - [Optimize CI Times](#optimize-ci-times)
- [Best Practices](#best-practices)
- [Next Steps](#next-steps)

## Overview

NX is a powerful build system that provides tools and techniques for managing monorepos at scale. This guide covers NX concepts, commands, and best practices specific to this GraphQL microservices project.

## Core Concepts

### Workspace Structure

```
.
├── apps/                      # Applications
│   ├── api-gateway/          # Apollo Federation Gateway
│   ├── users-service/        # Microservice
│   └── products-service/     # Microservice
├── libs/                      # Shared libraries
│   ├── common/               # Common utilities
│   └── codegen/              # Code generation
├── tools/                     # Custom workspace tools
├── nx.json                    # NX configuration
├── workspace.json             # Workspace configuration
└── tsconfig.base.json        # Base TypeScript config
```

### Mental Model

- **Apps**: Deployable units (services, gateways)
- **Libs**: Shared code (utilities, types, components)
- **Tools**: Build scripts and generators

## Essential NX Commands

### Development

```bash
# Serve application
nx serve users-service

# Serve with production configuration
nx serve users-service --configuration=production

# Serve multiple apps
nx run-many --target=serve --projects=users-service,products-service
```

### Building

```bash
# Build single app
nx build api-gateway

# Build all apps
nx run-many --target=build --all

# Build only affected by changes
nx affected:build

# Build with specific configuration
nx build users-service --configuration=production
```

### Testing

```bash
# Test single project
nx test users-service

# Test all projects
nx run-many --target=test --all

# Test only affected
nx affected:test

# Test with coverage
nx test users-service --coverage

# Test in watch mode
nx test users-service --watch
```

### Linting

```bash
# Lint single project
nx lint products-service

# Lint all
nx run-many --target=lint --all

# Lint and fix
nx lint users-service --fix

# Lint only affected
nx affected:lint
```

## Dependency Graph

### Visualize Dependencies

```bash
# Open interactive dependency graph
nx graph

# Generate dependency graph for affected projects
nx affected:graph

# Show dependencies of specific project
nx graph --focus=users-service
```

### Understanding Dependencies

NX automatically detects dependencies between projects:

```typescript
// In users-service
import { isValidEmail } from '@app/validation' // Creates dependency on validation lib
```

## Affected Commands

NX can determine which projects are affected by changes:

```bash
# Show affected projects
nx affected:apps
nx affected:libs

# Run commands only on affected projects
nx affected:build
nx affected:test
nx affected:lint

# Compare against specific base
nx affected:test --base=main --head=HEAD
```

## Computation Caching

### Local Caching

NX caches build outputs locally:

```bash
# First run - executes
nx build users-service

# Second run - retrieves from cache (instant)
nx build users-service

# Clear cache
nx reset
```

### Cache Configuration

In `nx.json`:

```json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "@nx/workspace/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "lint", "test"],
        "cacheDirectory": ".nx/cache"
      }
    }
  }
}
```

### Distributed Caching with Nx Cloud

```bash
# Connect to Nx Cloud
nx connect-to-nx-cloud

# Run with distributed cache
nx build users-service --skip-nx-cache=false
```

## Task Orchestration

### Run Tasks in Parallel

```json
// nx.json
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"]  // Build dependencies first
    }
  }
}
```

### Custom Task Pipelines

```bash
# Run multiple targets in order
nx run-many --target=lint,test,build --all

# Run with specific parallelism
nx run-many --target=test --all --parallel=3
```

## Generators

### Using Built-in Generators

```bash
# Generate new application
nx g @nx/nest:app new-service

# Generate library
nx g @nx/js:lib new-lib --directory=libs/common

# Generate with dry run
nx g @nx/nest:service user --project=users-service --dry-run
```

### Custom Generators

Create custom generators in `tools/generators/`:

```typescript
// tools/generators/service/index.ts
export default async function (tree: Tree, options: ServiceGeneratorSchema) {
  // Generate files
  generateFiles(tree, path.join(__dirname, 'files'), options.projectRoot, options)
  
  // Update configuration
  updateProjectConfiguration(tree, options.name, {
    /* ... */
  })
  
  // Format files
  await formatFiles(tree)
}
```

Use custom generator:

```bash
nx g @myorg/service:service my-feature
```

## Module Boundaries

### Enforce Constraints

Configure in `.eslintrc.json`:

```json
{
  "overrides": [
    {
      "rules": {
        "@nx/enforce-module-boundaries": [
          "error",
          {
            "enforceBuildableLibDependency": true,
            "allow": [],
            "depConstraints": [
              {
                "sourceTag": "scope:users",
                "onlyDependOnLibsWithTags": ["scope:shared", "scope:users"]
              },
              {
                "sourceTag": "scope:products",
                "onlyDependOnLibsWithTags": ["scope:shared", "scope:products"]
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

### Tag Projects

In `project.json`:

```json
{
  "tags": ["scope:users", "type:app"],
  "targets": {
    // ...
  }
}
```

## Performance Optimization

### 1. Use Computation Caching

```bash
# Enable caching for custom targets
{
  "targetDefaults": {
    "docker-build": {
      "cache": true,
      "inputs": ["default", "{projectRoot}/Dockerfile"],
      "outputs": ["{projectRoot}/dist"]
    }
  }
}
```

### 2. Incremental Builds

```json
// tsconfig.json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo"
  }
}
```

### 3. Parallel Execution

```bash
# Set max parallel processes
nx run-many --target=test --all --parallel=5

# Use all available CPUs
nx run-many --target=build --all --parallel
```

### 4. Affected Only in CI

```yaml
# .github/workflows/ci.yml
- name: Test affected
  run: nx affected:test --base=${{ github.event.before }}
```

## Common Patterns

### Shared Configuration

Create shared configs in libraries:

```typescript
// libs/shared/config/src/lib/database.config.ts
export const databaseConfig = {
  type: 'postgres',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development'
}

// Use in apps
import { databaseConfig } from '@app/shared/config'
```

### Environment-Specific Builds

```bash
# Development
nx serve users-service

# Production
nx serve users-service --configuration=production

# Custom environment
nx serve users-service --configuration=staging
```

Configure in `project.json`:

```json
{
  "configurations": {
    "production": {
      "optimization": true,
      "extractLicenses": true,
      "inspect": false
    },
    "staging": {
      "optimization": true,
      "sourceMap": true
    }
  }
}
```

### Workspace Libraries Pattern

```
libs/
├── common/           # Shared across all apps
│   ├── utils/       # Utility functions
│   ├── exceptions/  # Custom exceptions
│   └── validation/  # Validation logic
├── backend/         # Backend-specific
│   ├── prisma/     # Prisma utilities
│   └── auth/       # Auth utilities
└── frontend/        # Frontend-specific (if added)
    ├── ui/         # UI components
    └── hooks/      # React hooks
```

## Troubleshooting

### Clear Cache Issues

```bash
# Clear all caches
nx reset

# Clear specific cache
rm -rf .nx/cache

# Run without cache
nx build users-service --skip-nx-cache
```

### Circular Dependencies

```bash
# Find circular dependencies
nx graph

# Look for circular arrows in the graph
```

### Out of Memory

```bash
# Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" nx build all

# Reduce parallelism
nx run-many --target=build --all --parallel=2
```

### Module Resolution

Ensure `tsconfig.base.json` has correct paths:

```json
{
  "compilerOptions": {
    "paths": {
      "@app/validation": ["libs/common/validation/src/index.ts"],
      "@app/*": ["libs/*"]
    }
  }
}
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: CI
on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - uses: nrwl/nx-set-shas@v3
      
      - run: pnpm install
      
      - run: nx affected:lint
      - run: nx affected:test
      - run: nx affected:build
```

### Optimize CI Times

1. **Use affected commands**
2. **Enable distributed caching**
3. **Parallelize jobs**
4. **Use remote caching**

## Best Practices

1. **Keep apps thin** - Business logic in libraries
2. **Use tags** - Enforce architectural boundaries
3. **Cache everything** - Build, test, lint results
4. **Think in projects** - Not files or folders
5. **Use affected** - Don't rebuild everything
6. **Document deps** - Make relationships explicit

## Next Steps

- Read [Adding a New Service](./adding-new-service.md) for service setup
- See [Adding a New Library](./adding-new-library.md) for library creation
- Check [GraphQL Federation Guide](./graphql-federation-guide.md) for distributed architecture