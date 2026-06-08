# Build context is the repository root (see docker-compose.yml).
FROM node:20-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* tsconfig.base.json ./
COPY packages ./packages
COPY services ./services

RUN npm install
RUN npm run build:libs
RUN npm run build -w @bjm/orders-service

FROM node:20-slim AS runtime
WORKDIR /app/services/orders
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app /app

EXPOSE 3001
# Sync schema then start. For real environments use `prisma migrate deploy`.
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/main.js"]
