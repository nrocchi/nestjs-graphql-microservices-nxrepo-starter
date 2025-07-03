#!/bin/bash

echo "🚀 Initializing NestJS GraphQL Microservices Project"
echo "===================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
pnpm install
echo ""

# Step 1.5: Copy .env.example files to .env
echo -e "${BLUE}📄 Setting up environment files...${NC}"
cp apps/api-gateway/.env.example apps/api-gateway/.env
cp apps/users-service/.env.example apps/users-service/.env
cp apps/products-service/.env.example apps/products-service/.env
echo "Environment files created from .env.example templates"
echo ""

# Step 2: Start databases
echo -e "${BLUE}🐘 Starting PostgreSQL databases...${NC}"
docker-compose up postgres-users postgres-products -d
echo ""

# Wait for databases to be ready
echo -e "${YELLOW}⏳ Waiting for databases to be ready...${NC}"
sleep 5
echo ""

# Step 3: Generate Prisma clients
echo -e "${BLUE}🔧 Generating Prisma clients...${NC}"
pnpm prisma:generate:users
pnpm prisma:generate:products
echo ""

# Step 4: Run migrations
echo -e "${BLUE}📝 Running database migrations...${NC}"
pnpm prisma:migrate:users
pnpm prisma:migrate:products
echo ""

# Step 5: Seed data
echo -e "${BLUE}🌱 Seeding databases...${NC}"
# First seed users
pnpm prisma:seed:users
echo ""

# Then seed products (will read users directly from DB)
pnpm prisma:seed:products
echo ""

echo -e "${GREEN}✅ Project initialized successfully!${NC}"
echo ""
echo "To start all services, run:"
echo -e "${GREEN}pnpm dev${NC}"
echo ""
echo "GraphQL Playgrounds will be available at:"
echo "  - Gateway (Federation): http://localhost:3000/graphql"
echo "  - Users Service: http://localhost:3001/graphql"
echo "  - Products Service: http://localhost:3002/graphql"