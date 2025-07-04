# 📚 Home

Welcome to the NestJS GraphQL Microservices documentation. All documentation is organized by category with numerical prefixes for easy navigation.

## 📂 Documentation Structure

```
docs/
├── 01-getting-started/       # Introduction and basics
├── 02-architecture/          # System design and architecture
├── 03-development/           # Development guides
├── 04-best-practices/        # Standards and patterns
└── 05-operations/            # Deployment and operations
```

## 📖 Documentation by Category

### 01 - Getting Started

Essential documentation for new developers and project setup.

| Document | Description |
|----------|-------------|
| [01 - API Documentation](./01-getting-started/01-api-documentation.md) | Complete GraphQL API reference |
| [02 - Development Workflow](./01-getting-started/02-development-workflow.md) | Daily development guide |
| [03 - Troubleshooting](./01-getting-started/03-troubleshooting.md) | Common issues and solutions |

### 02 - Architecture

Technical architecture and system design documentation.

| Document | Description |
|----------|-------------|
| [01 - GraphQL Federation Guide](./02-architecture/01-graphql-federation-guide.md) | Distributed GraphQL architecture |
| [02 - NX Monorepo Guide](./02-architecture/02-nx-monorepo-guide.md) | Monorepo management with NX |
| [03 - Architecture Overview](./02-architecture/03-architecture-overview.md) | Visual architecture representations |

### 03 - Development

Step-by-step guides for development tasks.

| Document | Description |
|----------|-------------|
| [01 - Adding a New Service](./03-development/01-adding-new-service.md) | Create new microservices |
| [02 - Adding a New Library](./03-development/02-adding-new-library.md) | Create shared libraries |
| [03 - Code Generation Guide](./03-development/03-codegen-guide.md) | GraphQL code generation |

### 04 - Best Practices

Coding standards, patterns, and security practices.

| Document | Description |
|----------|-------------|
| [01 - GraphQL Best Practices](./04-best-practices/01-graphql-best-practices.md) | GraphQL patterns and optimization |
| [02 - Code Generation Best Practices](./04-best-practices/02-codegen-best-practices.md) | Codegen patterns and implementation |
| [03 - Security Guide](./04-best-practices/03-security.md) | Security best practices |

### 05 - Operations

Production deployment and operations documentation.

| Document | Description |
|----------|-------------|
| [01 - Deployment Guide](./05-operations/01-deployment.md) | Production deployment strategies |

## 🚀 Quick Start Paths

### For New Developers
1. Start with **[01 - API Documentation](./01-getting-started/01-api-documentation.md)**
2. Read **[02 - Development Workflow](./01-getting-started/02-development-workflow.md)**
3. Review **[01 - GraphQL Federation Guide](./02-architecture/01-graphql-federation-guide.md)**
4. Try **[01 - Adding a New Service](./03-development/01-adding-new-service.md)**

### For DevOps Engineers
1. Review **[01 - Deployment Guide](./05-operations/01-deployment.md)**
2. Check **[03 - Security Guide](./04-best-practices/03-security.md)**
3. Understand **[02 - NX Monorepo Guide](./02-architecture/02-nx-monorepo-guide.md)**

### For Architects
1. Study **[01 - GraphQL Federation Guide](./02-architecture/01-graphql-federation-guide.md)**
2. Review **[03 - Architecture Overview](./02-architecture/03-architecture-overview.md)**
3. Read **[01 - GraphQL Best Practices](./04-best-practices/01-graphql-best-practices.md)**

## 📋 Documentation Standards

### File Naming Convention

All documentation files follow this pattern:
```
[category-number]-[subcategory]/[document-number]-[document-name].md
```

Example: `01-getting-started/02-development-workflow.md`

### Adding New Documentation

When adding new documentation:

1. **Choose the right category** - Place documents in the appropriate numbered folder
2. **Use sequential numbering** - Add the next available number prefix
3. **Follow naming conventions** - Use lowercase with hyphens
4. **Update this index** - Add your document to the relevant section
5. **Cross-reference** - Link to related documents

### Documentation Template

```markdown
# Document Title

Brief description of what this document covers.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Main Content](#main-content)
- [Examples](#examples)
- [Next Steps](#next-steps)

## Overview

...

## Prerequisites

...

[content]

## Next Steps

- Link to related documentation
- Suggested follow-up tasks
```

## 🔍 Search Tips

- Use document numbers for quick navigation (e.g., "01-02" for Development Workflow)
- Category folders group related topics
- Architecture diagrams are in `02-architecture/03-architecture-overview.md`
- Security-related content is in `04-best-practices/03-security.md`

## 📝 Maintenance

This documentation is maintained as part of the codebase. When making changes:

- Update documentation alongside code changes
- Review and update examples
- Ensure all links remain valid
- Keep the numbering sequential

---

**Need help?** Start with **[03 - Troubleshooting](./01-getting-started/03-troubleshooting.md)** or check the **[02 - Development Workflow](./01-getting-started/02-development-workflow.md)**.