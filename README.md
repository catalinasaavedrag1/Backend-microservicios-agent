# Backend Microservices Agent — Event-Driven OMS

Event-driven Order Management System built as a reference for the
**Node.js Event-Driven Backend Architect Agent** (see
[`.claude/agents/backend-architect.md`](.claude/agents/backend-architect.md) and
[`CLAUDE.md`](CLAUDE.md)).

Stack: **TypeScript · Fastify · Prisma · PostgreSQL · KafkaJS · Zod · Vitest ·
ESLint · Prettier · Husky · Docker Compose**.

## What's inside

An npm-workspaces monorepo with three independently deployable microservices that
collaborate through a Kafka choreography saga (Outbox + Idempotency + Retry +
DLQ):

| Service             | Port | Owns         | Role                                    |
| ------------------- | ---- | ------------ | --------------------------------------- |
| `orders-service`    | 3001 | orders DB    | Creates orders; confirms/rejects (saga) |
| `inventory-service` | 3002 | inventory DB | Reserves stock; emits reserved/failed   |
| `picking-service`   | 3003 | picking DB   | Creates picking tasks                   |

```
packages/contracts   shared event envelope, topics & schemas (cross-service contract)
packages/shared      logger, errors, Kafka helpers, outbox relay, health, server
services/*           orders · inventory · picking  (clean architecture per service)
```

See [`docs/architecture.md`](docs/architecture.md) for the saga flow and
[`docs/event-catalog.md`](docs/event-catalog.md) for every event.

## Quickstart (Docker)

```bash
docker compose up --build
# Kafka + 3 Postgres + 3 services come up; schemas are applied on start.
```

Seed some stock and drive the saga:

```bash
# 1. give inventory some stock
curl -X PUT http://localhost:3002/stock -H 'content-type: application/json' \
  -d '{ "sku": "SKU-1", "available": 100 }'

# 2. create an order (triggers order.created -> stock-reserved -> confirm + picking)
curl -X POST http://localhost:3001/orders -H 'content-type: application/json' \
  -d '{ "customerId": "cust-1", "currency": "CLP",
        "items": [{ "sku": "SKU-1", "quantity": 2, "unitPrice": 1990 }] }'

# 3. observe results
curl http://localhost:3001/orders/<orderId>     # status: CONFIRMED
curl http://localhost:3003/picking-tasks        # a task was created
```

Try ordering more than the available stock to see the **compensation** path
(`reservation-failed` → order `REJECTED`).

## Local development (without Docker)

```bash
npm install
npm run build:libs        # build @bjm/contracts and @bjm/shared first
npm test                  # unit tests (no infra needed)

# run a single service against a local Postgres + Kafka (see each .env.example)
npm run dev -w @bjm/orders-service
```

## Useful scripts

| Command             | Description                  |
| ------------------- | ---------------------------- |
| `npm run build`     | Build libraries and services |
| `npm test`          | Run the Vitest suite         |
| `npm run lint`      | Lint with ESLint             |
| `npm run format`    | Format with Prettier         |
| `npm run typecheck` | Type-check every workspace   |

## Quality gates

- **Husky + lint-staged** run ESLint and Prettier on staged files pre-commit.
- ESLint forbids `console.log`, enforces `eqeqeq`, flags `any`.
- Clean architecture boundaries and reliability patterns are documented in
  [`CLAUDE.md`](CLAUDE.md).
