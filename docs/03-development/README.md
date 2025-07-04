# 03 - Development

This section contains step-by-step guides for common development tasks.

## Documents in this Section

1. **[01 - Adding a New Service](./01-adding-new-service.md)**
   - Complete guide to creating a new microservice
   - Database setup and migrations
   - GraphQL schema and resolver implementation
   - Federation integration

2. **[02 - Adding a New Library](./02-adding-new-library.md)**
   - Creating shared NX libraries
   - Library types and when to use them
   - Publishing and versioning
   - Import configuration

3. **[03 - Code Generation Guide](./03-codegen-guide.md)**
   - GraphQL Code Generator setup
   - Generating TypeScript types from schemas
   - Custom operations and fragments
   - Continuous generation workflow

## Development Tasks

Common development scenarios:

### Adding a Feature
1. Plan your GraphQL schema changes
2. Update Prisma models if needed
3. Generate types using codegen
4. Implement resolvers and services
5. Write tests
6. Update documentation

### Creating Shared Code
1. Identify reusable patterns
2. Create a new library using the guide
3. Extract and refactor code
4. Update imports across services
5. Test affected services

### Extending the API
1. Define new types in GraphQL schema
2. Run code generation
3. Implement business logic
4. Add validation and error handling
5. Document the new endpoints