FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm nx build api-gateway

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/dist/apps/api-gateway ./dist
COPY --from=builder /app/apps/api-gateway/.env ./.env

EXPOSE 3000

CMD ["node", "dist/main"]