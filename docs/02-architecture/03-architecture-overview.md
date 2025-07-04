# Architecture Overview

## Table of Contents

- [System Architecture](#system-architecture)
- [Request Flow](#request-flow)
- [Federation Architecture](#federation-architecture)
- [Database Schema](#database-schema)
- [Deployment Architecture](#deployment-architecture)
- [Development Workflow](#development-workflow)
- [CI/CD Pipeline](#cicd-pipeline)
- [Service Communication Patterns](#service-communication-patterns)
- [Security Architecture](#security-architecture)
- [Monitoring Architecture](#monitoring-architecture)
- [Data Flow Architecture](#data-flow-architecture)
- [Scaling Strategy](#scaling-strategy)
- [Rendering Diagrams](#rendering-diagrams)

This document contains comprehensive architecture diagrams for the NestJS GraphQL Microservices project.

## System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Web[Web App]
        Mobile[Mobile App]
        API[API Clients]
    end
    
    subgraph "API Gateway Layer"
        Gateway[Apollo Gateway<br/>:3000]
    end
    
    subgraph "Microservices Layer"
        Users[Users Service<br/>:3001]
        Products[Products Service<br/>:3002]
    end
    
    subgraph "Data Layer"
        UsersDB[(Users DB<br/>PostgreSQL<br/>:5432)]
        ProductsDB[(Products DB<br/>PostgreSQL<br/>:5433)]
    end
    
    Web --> Gateway
    Mobile --> Gateway
    API --> Gateway
    
    Gateway --> Users
    Gateway --> Products
    
    Users --> UsersDB
    Products --> ProductsDB
    
    Products -.->|Federation<br/>Reference| Users
```

## Request Flow

```mermaid
sequenceDiagram
    participant Client
    participant Gateway
    participant Users
    participant Products
    participant UsersDB
    participant ProductsDB
    
    Client->>Gateway: GraphQL Query
    Gateway->>Gateway: Query Planning
    
    alt Simple User Query
        Gateway->>Users: Get User Data
        Users->>UsersDB: SQL Query
        UsersDB-->>Users: User Records
        Users-->>Gateway: User Response
    else User with Products Query
        Gateway->>Users: Get User Data
        Gateway->>Products: Get Products by UserID
        Users->>UsersDB: SQL Query
        Products->>ProductsDB: SQL Query
        UsersDB-->>Users: User Records
        ProductsDB-->>Products: Product Records
        Users-->>Gateway: User Response
        Products-->>Gateway: Products Response
        Gateway->>Gateway: Merge Results
    end
    
    Gateway-->>Client: Combined Response
```

## Federation Architecture

```mermaid
graph LR
    subgraph "API Gateway"
        Router[Query Router]
        Planner[Query Planner]
        Merger[Response Merger]
    end
    
    subgraph "Users Subgraph"
        UserSchema[User Schema]
        UserResolver[User Resolver]
        UserEntity[User Entity<br/>@key: id]
    end
    
    subgraph "Products Subgraph"
        ProductSchema[Product Schema]
        ProductResolver[Product Resolver]
        UserExt[User Extension<br/>@extends User]
    end
    
    Router --> Planner
    Planner --> UserResolver
    Planner --> ProductResolver
    
    UserResolver --> UserEntity
    ProductResolver --> UserExt
    
    UserEntity -.->|Reference| UserExt
    
    UserResolver --> Merger
    ProductResolver --> Merger
```

## Database Schema

```mermaid
erDiagram
    User {
        string id PK
        string email UK
        string name
        string password
        datetime createdAt
        datetime updatedAt
    }
    
    Product {
        string id PK
        string name
        string description
        decimal price
        string sku UK
        int stock
        string userId FK
        datetime createdAt
        datetime updatedAt
    }
    
    Favorite {
        string id PK
        string userId FK
        string productId FK
        datetime createdAt
    }
    
    User ||--o{ Product : owns
    User ||--o{ Favorite : has
    Product ||--o{ Favorite : is_favorited
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Production Environment"
        subgraph "Load Balancer"
            LB[AWS ALB / Nginx]
        end
        
        subgraph "Container Orchestration"
            subgraph "API Gateway Pods"
                GW1[Gateway-1]
                GW2[Gateway-2]
                GW3[Gateway-3]
            end
            
            subgraph "Users Service Pods"
                US1[Users-1]
                US2[Users-2]
            end
            
            subgraph "Products Service Pods"
                PS1[Products-1]
                PS2[Products-2]
            end
        end
        
        subgraph "Managed Services"
            RDS1[(RDS Users)]
            RDS2[(RDS Products)]
            Redis[Redis Cache]
            S3[S3 Storage]
        end
    end
    
    LB --> GW1
    LB --> GW2
    LB --> GW3
    
    GW1 --> US1
    GW1 --> US2
    GW1 --> PS1
    GW1 --> PS2
    
    US1 --> RDS1
    US2 --> RDS1
    PS1 --> RDS2
    PS2 --> RDS2
    
    US1 --> Redis
    PS1 --> Redis
```

## Development Workflow

```mermaid
gitGraph
    commit id: "main"
    branch feature/user-auth
    checkout feature/user-auth
    commit id: "Add auth module"
    commit id: "Add JWT strategy"
    commit id: "Add tests"
    checkout main
    merge feature/user-auth
    
    branch feature/products-api
    checkout feature/products-api
    commit id: "Add products schema"
    commit id: "Add products resolver"
    checkout main
    merge feature/products-api
    
    branch hotfix/security-patch
    checkout hotfix/security-patch
    commit id: "Fix vulnerability"
    checkout main
    merge hotfix/security-patch tag: "v1.0.1"
```

## CI/CD Pipeline

```mermaid
graph LR
    subgraph "Source Control"
        Git[GitHub/GitLab]
    end
    
    subgraph "CI Pipeline"
        Test[Run Tests]
        Lint[Lint Code]
        Build[Build Images]
        Scan[Security Scan]
    end
    
    subgraph "Registry"
        ECR[Container Registry]
    end
    
    subgraph "CD Pipeline"
        Deploy[Deploy to K8s]
        Migrate[Run Migrations]
        Health[Health Checks]
    end
    
    subgraph "Environments"
        Dev[Development]
        Staging[Staging]
        Prod[Production]
    end
    
    Git --> Test
    Test --> Lint
    Lint --> Build
    Build --> Scan
    Scan --> ECR
    ECR --> Deploy
    Deploy --> Migrate
    Migrate --> Health
    Health --> Dev
    Dev --> Staging
    Staging --> Prod
```

## Service Communication Patterns

```mermaid
graph TB
    subgraph "Synchronous Communication"
        subgraph "GraphQL Federation"
            GQL1[Service A] -->|GraphQL| GQL2[Service B]
        end
        
        subgraph "REST (Internal)"
            REST1[Service C] -->|HTTP/REST| REST2[Service D]
        end
    end
    
    subgraph "Asynchronous Communication"
        subgraph "Event Bus"
            Publisher[Service E] -->|Publish| EventBus[RabbitMQ/Kafka]
            EventBus -->|Subscribe| Subscriber1[Service F]
            EventBus -->|Subscribe| Subscriber2[Service G]
        end
    end
    
    subgraph "Caching Layer"
        Cache[Redis] --> GQL1
        Cache --> REST1
        Cache --> Publisher
    end
```

## Security Architecture

```mermaid
graph TB
    subgraph "External"
        Client[Client Application]
    end
    
    subgraph "Edge Security"
        WAF[Web Application Firewall]
        DDoS[DDoS Protection]
    end
    
    subgraph "API Gateway Security"
        RateLimit[Rate Limiting]
        Auth[Authentication]
        CORS[CORS Policy]
    end
    
    subgraph "Service Security"
        JWT[JWT Validation]
        RBAC[Role-Based Access]
        Encryption[Data Encryption]
    end
    
    subgraph "Data Security"
        DBEncrypt[DB Encryption at Rest]
        TLS[TLS in Transit]
        Backup[Encrypted Backups]
    end
    
    Client --> WAF
    WAF --> DDoS
    DDoS --> RateLimit
    RateLimit --> Auth
    Auth --> CORS
    CORS --> JWT
    JWT --> RBAC
    RBAC --> Encryption
    Encryption --> DBEncrypt
    DBEncrypt --> TLS
    TLS --> Backup
```

## Monitoring Architecture

```mermaid
graph TB
    subgraph "Application Layer"
        App1[Gateway]
        App2[Users Service]
        App3[Products Service]
    end
    
    subgraph "Telemetry Collection"
        Metrics[Prometheus]
        Logs[ELK Stack]
        Traces[Jaeger/Zipkin]
    end
    
    subgraph "Visualization"
        Grafana[Grafana Dashboards]
        Kibana[Kibana Logs]
        Jaeger[Jaeger UI]
    end
    
    subgraph "Alerting"
        Alert[Alert Manager]
        Slack[Slack]
        PagerDuty[PagerDuty]
    end
    
    App1 --> Metrics
    App1 --> Logs
    App1 --> Traces
    
    App2 --> Metrics
    App2 --> Logs
    App2 --> Traces
    
    App3 --> Metrics
    App3 --> Logs
    App3 --> Traces
    
    Metrics --> Grafana
    Logs --> Kibana
    Traces --> Jaeger
    
    Grafana --> Alert
    Alert --> Slack
    Alert --> PagerDuty
```

## Data Flow Architecture

```mermaid
graph LR
    subgraph "Input Layer"
        GraphQL[GraphQL Query]
        REST[REST Request]
    end
    
    subgraph "Validation Layer"
        InputVal[Input Validation]
        AuthCheck[Auth Check]
        RateCheck[Rate Limit Check]
    end
    
    subgraph "Business Logic"
        Resolver[Resolver/Controller]
        Service[Service Layer]
        DataLoader[DataLoader]
    end
    
    subgraph "Data Access"
        Prisma[Prisma ORM]
        Cache[Cache Layer]
    end
    
    subgraph "Storage"
        DB[(PostgreSQL)]
        Redis[(Redis)]
    end
    
    GraphQL --> InputVal
    REST --> InputVal
    InputVal --> AuthCheck
    AuthCheck --> RateCheck
    RateCheck --> Resolver
    Resolver --> Service
    Service --> DataLoader
    DataLoader --> Cache
    Cache --> Prisma
    Cache --> Redis
    Prisma --> DB
```

## Scaling Strategy

```mermaid
graph TB
    subgraph "Horizontal Scaling"
        subgraph "Auto Scaling Groups"
            ASG1[Gateway ASG<br/>Min: 2, Max: 10]
            ASG2[Users ASG<br/>Min: 2, Max: 5]
            ASG3[Products ASG<br/>Min: 2, Max: 5]
        end
    end
    
    subgraph "Vertical Scaling"
        subgraph "Database"
            Master[(Primary DB<br/>Writable)]
            Replica1[(Read Replica 1)]
            Replica2[(Read Replica 2)]
        end
    end
    
    subgraph "Caching Strategy"
        CDN[CloudFront CDN]
        AppCache[Application Cache]
        DBCache[Query Cache]
    end
    
    ASG1 --> Master
    ASG1 --> Replica1
    ASG1 --> Replica2
    
    ASG2 --> Master
    ASG2 --> Replica1
    
    ASG3 --> Master
    ASG3 --> Replica2
    
    CDN --> ASG1
    ASG1 --> AppCache
    AppCache --> DBCache
```

## Rendering Diagrams

These diagrams use Mermaid syntax and can be rendered in:
- GitHub/GitLab (automatic rendering)
- VS Code with Mermaid plugin
- Online at [mermaid.live](https://mermaid.live)
- Documentation sites like Docusaurus

To export as images:
1. Copy the Mermaid code
2. Paste into [mermaid.live](https://mermaid.live)
3. Export as PNG/SVG
4. Save to this folder