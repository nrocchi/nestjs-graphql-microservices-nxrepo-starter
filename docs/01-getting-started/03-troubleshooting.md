# Troubleshooting Guide

This guide covers common issues and their solutions when working with the NestJS GraphQL Microservices project.

## Table of Contents

- [Service Startup Issues](#service-startup-issues)
- [Database Connection Problems](#database-connection-problems)
- [GraphQL Errors](#graphql-errors)
- [Code Generation Issues](#code-generation-issues)
- [Docker Issues](#docker-issues)
- [Federation Problems](#federation-problems)
- [TypeScript Errors](#typescript-errors)
- [Performance Issues](#performance-issues)
- [Development Environment](#development-environment)

## Service Startup Issues

### Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solutions:**

1. Find and kill the process:
```bash
# Find process using the port
lsof -ti:3001

# Kill the process
kill -9 <PID>

# Or kill all services at once
lsof -ti:3000,3001,3002 | xargs kill -9
```

2. Use different ports:
```bash
# In .env file
PORT=3003
```

### Service Failed to Start

**Error:**
```
Cannot find module '@app/common/exceptions'
```

**Solutions:**

1. Check TypeScript paths in `tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@app/common/*": ["libs/common/*/src/index.ts"]
    }
  }
}
```

2. Rebuild the project:
```bash
nx reset
pnpm install
nx build <service-name>
```

### Gateway Can't Connect to Services

**Error:**
```
Couldn't load service definitions for "users" at http://localhost:3001/graphql
```

**Solutions:**

1. Ensure services start before gateway:
```bash
# Start services first
pnpm start:users
pnpm start:products

# Wait, then start gateway
pnpm start:gateway
```

2. Or use the dev script with proper timing:
```bash
pnpm dev
```

## Database Connection Problems

### PostgreSQL Connection Refused

**Error:**
```
PrismaClientInitializationError: Can't reach database server at `localhost:5432`
```

**Solutions:**

1. Check if Docker containers are running:
```bash
docker ps
# If not running:
pnpm docker:up
```

2. Verify connection string in `.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/users_db?schema=public"
```

3. Check Docker logs:
```bash
docker logs nestjs-users-db
```

### Migration Failures

**Error:**
```
Error: P3009 migrate found failed migrations in the target database
```

**Solutions:**

1. Reset the database:
```bash
# Drop and recreate database
docker exec -it nestjs-users-db psql -U postgres -c "DROP DATABASE users_db;"
docker exec -it nestjs-users-db psql -U postgres -c "CREATE DATABASE users_db;"

# Run migrations again
pnpm prisma:migrate:users
```

2. Force reset (development only):
```bash
pnpm prisma migrate reset --schema=apps/users-service/prisma/schema.prisma
```

### Prisma Client Out of Sync

**Error:**
```
The table `public.User` does not exist in the current database
```

**Solutions:**

1. Regenerate Prisma client:
```bash
pnpm prisma:generate:users
pnpm prisma:generate:products
```

2. Run pending migrations:
```bash
pnpm prisma:migrate:users
pnpm prisma:migrate:products
```

## GraphQL Errors

### Schema Mismatch

**Error:**
```
GraphQLError: Cannot query field "X" on type "Y"
```

**Solutions:**

1. Regenerate types:
```bash
# Ensure all services are running
pnpm dev

# In another terminal
pnpm codegen
```

2. Restart TypeScript server in IDE:
- VS Code: `Cmd/Ctrl + Shift + P` → "TypeScript: Restart TS Server"

### Federation Entity Not Found

**Error:**
```
Cannot return null for non-nullable field User.email
```

**Solutions:**

1. Implement proper reference resolver:
```typescript
@ResolveReference()
async resolveReference(reference: { __typename: string; id: string }) {
  const user = await this.usersService.findOneById(reference.id)
  if (!user) {
    // Log but don't throw
    this.logger.warn(`User ${reference.id} not found`)
    return null
  }
  return user
}
```

2. Check entity keys match:
```typescript
// Must be consistent across services
@Directive('@key(fields: "id")')
```

## Code Generation Issues

### Services Not Running

**Error:**
```
Failed to load schema from http://localhost:3001/graphql
```

**Solution:**
```bash
# Start services first
pnpm dev

# Then in another terminal
pnpm codegen
```

### Missing Types

**Error:**
```
Cannot find name 'I_Service'
Cannot find name 'IQuery__EntitiesArgs'
```

**Solution:**
These types are imported from `@libs/codegen`. Check that:

1. The import exists in generated files
2. Federation types are properly exported:
```typescript
// libs/codegen/src/federation-types.ts
export interface I_Service {
  sdl: string;
}
```

### Outdated Generated Files

**Symptoms:**
- TypeScript errors after schema changes
- Auto-completion not working

**Solution:**
```bash
# Delete generated files
find . -path "*/generated/*" -type f -name "*.ts" -delete

# Regenerate
pnpm codegen
```

## Docker Issues

### Container Won't Start

**Error:**
```
docker: Error response from daemon: Conflict. The container name "/nestjs-users-db" is already in use
```

**Solutions:**

1. Remove existing containers:
```bash
pnpm docker:down
docker rm -f nestjs-users-db nestjs-products-db
pnpm docker:up
```

2. Full reset:
```bash
pnpm project:reset
pnpm project:init
```

### Out of Disk Space

**Error:**
```
no space left on device
```

**Solutions:**

1. Clean Docker system:
```bash
# Remove unused containers, images, volumes
docker system prune -a --volumes

# Check space
docker system df
```

### Permission Denied

**Error:**
```
docker: Got permission denied while trying to connect to the Docker daemon socket
```

**Solution (Linux/Mac):
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Restart session or run
newgrp docker
```

## Federation Problems

### Type Extensions Not Working

**Symptom:**
Products not showing on User type

**Solutions:**

1. Verify federation setup:
```typescript
// In products service
@Resolver(() => User)
export class UserResolver {
  @ResolveField(() => [Product])
  async products(@Parent() user: User) {
    return this.productsService.findByUserId(user.id)
  }
}
```

2. Check gateway configuration includes all services:
```typescript
subgraphs: [
  { name: 'users', url: 'http://localhost:3001/graphql' },
  { name: 'products', url: 'http://localhost:3002/graphql' },
]
```

### Query Planning Errors

**Error:**
```
Query planning failed: Cannot find field "products" on type "User"
```

**Solution:**
Ensure proper directives:
```typescript
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

## TypeScript Errors

### Module Resolution Issues

**Error:**
```
TS2307: Cannot find module '@app/validation' or its corresponding type declarations
```

**Solutions:**

1. Check path mapping in `tsconfig.base.json`
2. Ensure index.ts exports properly:
```typescript
// libs/validation/src/index.ts
export * from './lib/validation'
```

3. Restart IDE/TypeScript server

### Type Mismatch Errors

**Error:**
```
Type 'PrismaUser' is not assignable to type 'IUser'
```

**Solution:**
Use transformation functions:
```typescript
private toGraphQLUser(user: PrismaUser): IUser {
  return {
    ...user,
    __typename: 'User' as const
  }
}
```

## Performance Issues

### Slow Queries (N+1 Problem)

**Symptom:**
Multiple database queries for related data

**Solution:**
Implement DataLoader:
```typescript
@Injectable()
export class UserLoader {
  createLoader() {
    return new DataLoader(async (ids: string[]) => {
      const users = await this.prisma.user.findMany({
        where: { id: { in: ids } }
      })
      return ids.map(id => users.find(u => u.id === id))
    })
  }
}
```

### High Memory Usage

**Solutions:**

1. Limit query depth:
```typescript
GraphQLModule.forRoot({
  validationRules: [depthLimit(5)]
})
```

2. Add pagination:
```typescript
@Query(() => [User])
async users(
  @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
  @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number
) {
  return this.prisma.user.findMany({ take: limit, skip: offset })
}
```

## Development Environment

### NX Cache Issues

**Symptoms:**
- Outdated build outputs
- Changes not reflected

**Solution:**
```bash
nx reset
```

### IDE Not Recognizing Types

**VS Code Solutions:**

1. Reload window: `Cmd/Ctrl + Shift + P` → "Developer: Reload Window"
2. Clear TypeScript cache: `Cmd/Ctrl + Shift + P` → "TypeScript: Restart TS Server"
3. Ensure correct TypeScript version:
```json
// .vscode/settings.json
{
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### Git Pre-commit Hooks Failing

**Error:**
```
husky - pre-commit hook exited with code 1
```

**Solutions:**

1. Fix linting errors:
```bash
pnpm lint --fix
```

2. Skip hooks temporarily (not recommended):
```bash
git commit --no-verify
```

## Quick Fixes Checklist

When something isn't working, try these in order:

1. ✅ **Restart services**: `Ctrl+C` and `pnpm dev`
2. ✅ **Regenerate types**: `pnpm codegen`
3. ✅ **Clear caches**: `nx reset`
4. ✅ **Reinstall dependencies**: `rm -rf node_modules && pnpm install`
5. ✅ **Restart Docker**: `pnpm docker:down && pnpm docker:up`
6. ✅ **Full reset**: `pnpm project:reset && pnpm project:init`

## Getting Help

If you're still stuck:

1. Check the [NX Discord](https://go.nx.dev/community)
2. Search [NestJS GitHub Issues](https://github.com/nestjs/nest/issues)
3. Review [Apollo Federation Docs](https://www.apollographql.com/docs/federation/)
4. Ask on [Stack Overflow](https://stackoverflow.com/questions/tagged/nestjs)

Remember to include:
- Error messages
- Steps to reproduce
- Environment details (OS, Node version, etc.)
- Relevant code snippets