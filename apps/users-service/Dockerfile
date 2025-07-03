FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm nx build users-service
RUN pnpm prisma generate --schema=apps/users-service/prisma/schema.prisma

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --prod --frozen-lockfile
RUN pnpm add prisma @prisma/client

COPY --from=builder /app/dist/apps/users-service ./dist
COPY --from=builder /app/apps/users-service/prisma ./prisma
COPY --from=builder /app/apps/users-service/.env ./.env
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3001

CMD ["node", "dist/main"]