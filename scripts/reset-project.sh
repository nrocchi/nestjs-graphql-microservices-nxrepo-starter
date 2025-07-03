#!/bin/bash

echo "🧹 Resetting NestJS GraphQL Microservices Project"
echo "================================================="
echo ""

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Warning
echo -e "${RED}⚠️  WARNING: This will delete all data in your databases!${NC}"
echo -e "${YELLOW}Press Ctrl+C to cancel, or Enter to continue...${NC}"
read

# Stop all containers and remove volumes
echo -e "${YELLOW}🐳 Stopping Docker containers and removing volumes...${NC}"
docker-compose down -v
echo ""

# Remove Docker images
echo -e "${YELLOW}🗑️  Removing Docker images...${NC}"
docker rmi nestjs-graphql-microservices-starter-api-gateway 2>/dev/null || true
docker rmi nestjs-graphql-microservices-starter-users-service 2>/dev/null || true
docker rmi nestjs-graphql-microservices-starter-products-service 2>/dev/null || true
echo ""

# Note: No temporary files to clean anymore
echo ""

echo -e "${GREEN}✅ Databases reset successfully!${NC}"
echo ""
echo "To reinitialize the project, run:"
echo -e "${GREEN}pnpm project:init${NC}"