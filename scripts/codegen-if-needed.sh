#!/bin/bash

# Check if any generated files exist
if [ -f "apps/users-service/src/generated/graphql.ts" ] && \
   [ -f "apps/products-service/src/generated/graphql.ts" ] && \
   [ -f "apps/api-gateway/src/generated/graphql.ts" ]; then
  echo "✅ Generated files already exist. Skipping codegen."
  echo "   Run 'pnpm codegen' manually to regenerate types."
else
  echo "⚠️  No generated files found. Please ensure services are running and run 'pnpm codegen' manually."
  echo "   Alternatively, use 'pnpm dev:init' to start services and generate types."
fi