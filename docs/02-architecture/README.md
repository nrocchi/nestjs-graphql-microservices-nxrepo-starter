# 02 - Architecture

This section covers the technical architecture and system design of the NestJS GraphQL Microservices project.

## Documents in this Section

1. **[01 - GraphQL Federation Guide](./01-graphql-federation-guide.md)**
   - Apollo Federation implementation
   - Subgraph design patterns
   - Entity relationships across services
   - Query planning and execution

2. **[02 - NX Monorepo Guide](./02-nx-monorepo-guide.md)**
   - Monorepo structure and organization
   - NX workspace configuration
   - Build and dependency management
   - Affected commands and caching

3. **[03 - Architecture Overview](./03-architecture-overview.md)**
   - Visual representations of system architecture
   - Request flow diagrams
   - Database schema diagrams
   - Deployment architecture
   - All diagrams in Mermaid format

## Key Architectural Decisions

- **Microservices**: Each domain (Users, Products) has its own service
- **Federation**: Services are composed using Apollo Federation
- **Database per Service**: Each service owns its data
- **Shared Libraries**: Common code is extracted into NX libraries
- **TypeScript**: Full type safety across the stack

## Architecture Principles

1. **Domain-Driven Design**: Services align with business domains
2. **Loose Coupling**: Services communicate through well-defined GraphQL schemas
3. **High Cohesion**: Related functionality stays together
4. **Scalability**: Each service can scale independently
5. **Maintainability**: Clear separation of concerns