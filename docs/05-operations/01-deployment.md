# Deployment Guide

This guide covers various deployment strategies for the NestJS GraphQL Microservices architecture.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Containerization](#containerization)
- [Deployment Strategies](#deployment-strategies)
  - [Docker Compose](#docker-compose-production)
  - [Kubernetes](#kubernetes-deployment)
  - [AWS ECS](#aws-ecs)
  - [Google Cloud Run](#google-cloud-run)
  - [Heroku](#heroku-deployment)
- [Database Deployment](#database-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring & Logging](#monitoring--logging)
- [Scaling Strategies](#scaling-strategies)
- [Security Checklist](#security-checklist)

## Prerequisites

Before deploying, ensure you have:

- [ ] All environment variables configured
- [ ] Database migrations tested
- [ ] Docker images built and tested
- [ ] SSL certificates ready
- [ ] Domain names configured
- [ ] Monitoring solutions chosen

## Environment Configuration

### Production Environment Variables

Create production `.env` files:

```env
# .env.production
NODE_ENV=production

# API Gateway
GATEWAY_PORT=3000
APOLLO_KEY=your-apollo-studio-key
APOLLO_GRAPH_REF=your-graph@production

# Users Service
USERS_SERVICE_PORT=3001
USERS_DATABASE_URL=postgresql://user:pass@prod-db:5432/users?schema=public
JWT_SECRET=your-production-jwt-secret
BCRYPT_ROUNDS=12

# Products Service
PRODUCTS_SERVICE_PORT=3002
PRODUCTS_DATABASE_URL=postgresql://user:pass@prod-db:5433/products?schema=public

# Security
CORS_ORIGIN=https://your-domain.com
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=15m
```

### Configuration Management

Use a configuration service or secrets manager:

```typescript
// libs/config/src/lib/config.service.ts
@Injectable()
export class ConfigService {
  get(key: string): string {
    // In production, fetch from AWS Secrets Manager, Vault, etc.
    if (process.env.NODE_ENV === 'production') {
      return this.getFromSecretsManager(key)
    }
    return process.env[key]
  }
}
```

## Containerization

### Multi-Stage Docker Build

Create optimized Docker images:

```dockerfile
# apps/users-service/Dockerfile
FROM node:18-alpine AS dependencies
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=dependencies /app/node_modules ./node_modules
RUN npm install -g pnpm @nx/cli
RUN pnpm nx build users-service --configuration=production

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

COPY --from=builder /app/dist/apps/users-service ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/users-service/prisma ./prisma

USER nestjs
EXPOSE 3001
CMD ["node", "main.js"]
```

### Build All Services

```bash
# Build script (scripts/build-docker.sh)
#!/bin/bash
docker build -f apps/api-gateway/Dockerfile -t myapp/gateway:latest .
docker build -f apps/users-service/Dockerfile -t myapp/users:latest .
docker build -f apps/products-service/Dockerfile -t myapp/products:latest .
```

## Deployment Strategies

### Docker Compose Production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  gateway:
    image: myapp/gateway:latest
    ports:
      - "80:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - users-service
      - products-service
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  users-service:
    image: myapp/users:latest
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${USERS_DATABASE_URL}
    depends_on:
      - postgres-users
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]

  products-service:
    image: myapp/products:latest
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${PRODUCTS_DATABASE_URL}
    depends_on:
      - postgres-products
    restart: always

  postgres-users:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: users_prod
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - users-data:/var/lib/postgresql/data
    restart: always

  postgres-products:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: products_prod
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - products-data:/var/lib/postgresql/data
    restart: always

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - gateway
    restart: always

volumes:
  users-data:
  products-data:
```

### Kubernetes Deployment

#### Service Deployment

```yaml
# k8s/users-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: users-service
  labels:
    app: users-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: users-service
  template:
    metadata:
      labels:
        app: users-service
    spec:
      containers:
      - name: users-service
        image: myapp/users:latest
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: users-secrets
              key: database-url
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: users-service
spec:
  selector:
    app: users-service
  ports:
    - port: 3001
      targetPort: 3001
  type: ClusterIP
```

#### Ingress Configuration

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-gateway-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - api.yourdomain.com
    secretName: api-tls
  rules:
  - host: api.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-gateway
            port:
              number: 3000
```

### AWS ECS

#### Task Definition

```json
{
  "family": "users-service",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "users-service",
      "image": "123456789.dkr.ecr.us-east-1.amazonaws.com/users-service:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:db-url"
        }
      ],
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3001/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      },
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/users-service",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Google Cloud Run

```yaml
# cloudbuild.yaml
steps:
  # Build images
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/users-service', '-f', 'apps/users-service/Dockerfile', '.']
  
  # Push to registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/users-service']
  
  # Deploy to Cloud Run
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'users-service'
      - '--image=gcr.io/$PROJECT_ID/users-service'
      - '--region=us-central1'
      - '--platform=managed'
      - '--allow-unauthenticated'
      - '--set-env-vars=NODE_ENV=production'
      - '--set-secrets=DATABASE_URL=users-db-url:latest'
```

### Heroku Deployment

```json
// package.json additions
{
  "scripts": {
    "heroku-postbuild": "pnpm nx build api-gateway --configuration=production",
    "start:prod": "node dist/apps/api-gateway/main.js"
  }
}
```

```yaml
# heroku.yml
build:
  docker:
    web: apps/api-gateway/Dockerfile
run:
  web: node main.js
```

## Database Deployment

### Managed Database Services

#### AWS RDS

```typescript
// terraform/rds.tf
resource "aws_db_instance" "users" {
  identifier = "users-prod"
  engine     = "postgres"
  engine_version = "16"
  instance_class = "db.t3.micro"
  allocated_storage = 20
  storage_encrypted = true
  
  db_name  = "users_prod"
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = 7
  backup_window = "03:00-04:00"
  maintenance_window = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = false
  deletion_protection = true
}
```

### Database Migrations

```bash
# Run migrations during deployment
#!/bin/bash
echo "Running database migrations..."
pnpm prisma migrate deploy --schema=apps/users-service/prisma/schema.prisma
pnpm prisma migrate deploy --schema=apps/products-service/prisma/schema.prisma
```

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm nx affected:test --base=origin/main~1
      - run: pnpm nx affected:lint --base=origin/main~1

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push images
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        run: |
          docker build -f apps/api-gateway/Dockerfile -t $ECR_REGISTRY/api-gateway:$GITHUB_SHA .
          docker build -f apps/users-service/Dockerfile -t $ECR_REGISTRY/users-service:$GITHUB_SHA .
          docker build -f apps/products-service/Dockerfile -t $ECR_REGISTRY/products-service:$GITHUB_SHA .
          
          docker push $ECR_REGISTRY/api-gateway:$GITHUB_SHA
          docker push $ECR_REGISTRY/users-service:$GITHUB_SHA
          docker push $ECR_REGISTRY/products-service:$GITHUB_SHA

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster production --service api-gateway --force-new-deployment
          aws ecs update-service --cluster production --service users-service --force-new-deployment
          aws ecs update-service --cluster production --service products-service --force-new-deployment
```

## Monitoring & Logging

### Application Monitoring

```typescript
// libs/monitoring/src/lib/monitoring.module.ts
import { PrometheusModule } from '@willsoto/nestjs-prometheus'
import { LoggerModule } from 'nestjs-pino'

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
      },
      path: '/metrics',
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL || 'info',
        transport: process.env.NODE_ENV !== 'production' 
          ? { target: 'pino-pretty' }
          : undefined,
      },
    }),
  ],
})
export class MonitoringModule {}
```

### Health Checks

```typescript
// apps/users-service/src/health/health.controller.ts
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: PrismaHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ])
  }

  @Get('ready')
  ready() {
    return { status: 'ready' }
  }
}
```

## Scaling Strategies

### Horizontal Pod Autoscaling

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: users-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: users-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Database Connection Pooling

```typescript
// Configure Prisma connection pool
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  connectionLimit = 10
}
```

## Security Checklist

### Pre-Deployment

- [ ] Environment variables secured
- [ ] Secrets in secret manager
- [ ] SSL/TLS configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Authentication/Authorization tested
- [ ] Input validation active
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] Dependency vulnerabilities scanned

### Post-Deployment

- [ ] Security headers configured
- [ ] Monitoring alerts set up
- [ ] Backup strategy implemented
- [ ] Disaster recovery tested
- [ ] Access logs enabled
- [ ] Intrusion detection active

## Rollback Strategy

### Blue-Green Deployment

```bash
#!/bin/bash
# Deploy to green environment
kubectl set image deployment/users-service users-service=myapp/users:$NEW_VERSION -n green

# Test green environment
./scripts/smoke-tests.sh https://green.api.domain.com

# Switch traffic
kubectl patch service users-service -p '{"spec":{"selector":{"version":"green"}}}'

# Keep blue as backup
echo "Blue environment kept as rollback option"
```

### Database Rollback

```bash
# Always backup before migration
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# Rollback if needed
psql $DATABASE_URL < backup-20240101-120000.sql
```

## Performance Optimization

### CDN Configuration

```nginx
# nginx.conf
location /graphql {
    proxy_pass http://gateway:3000;
    proxy_cache_bypass $http_upgrade;
    
    # Don't cache mutations
    proxy_cache_methods GET HEAD;
    proxy_cache_valid 200 1m;
    
    add_header X-Cache-Status $upstream_cache_status;
}
```

### Query Complexity Limits

```typescript
GraphQLModule.forRoot({
  validationRules: [
    depthLimit(7),
    costAnalysis({
      maximumCost: 1000,
      defaultCost: 1,
    }),
  ],
})
```

## Next Steps

- Set up monitoring dashboards
- Configure alerting rules
- Implement automated backups
- Plan disaster recovery drills
- Schedule security audits
- Document runbooks