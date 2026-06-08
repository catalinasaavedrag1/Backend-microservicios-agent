# CLAUDE.md — Project standards

Event-driven OMS microservices. \*\*Fastify + Prisma + PostgreSQL + KafkaJS + Zod

- Vitest\*\*, organized as an npm-workspaces monorepo.

For the full architect persona and PR review checklist see
[`.claude/agents/backend-architect.md`](.claude/agents/backend-architect.md).

## Layout

```
packages/
  contracts/   # shared event envelope, topics, event schemas (the ONLY cross-service contract)
  shared/      # cross-cutting infra: logger, errors, Kafka helpers, outbox relay, health, server
services/
  orders/      # command side: creates orders, reacts to inventory events
  inventory/   # reserves stock, emits reserved/failed
  picking/     # creates picking tasks once stock is reserved
```

Each service follows clean architecture:
`domain/` → `application/` (use-cases + ports) → `infrastructure/` (http, persistence, kafka).

## Non-negotiable rules

- **Service boundaries:** each service owns its database; never query another
  service's DB. Communicate via REST (commands/queries) or events (state
  changes). Share **contracts only** (`@bjm/contracts`), never domain entities.
- **Controllers stay thin:** validate input (Zod via `parseWith`) and delegate.
  No business logic in controllers.
- **Domain is pure:** no Prisma/Fastify/Kafka imports in `domain/`.
- **Events are versioned** and wrapped in the standard `DomainEvent` envelope
  with `correlationId` / `causationId`.
- **Reliable messaging:** writes use the **transactional outbox**; consumers are
  **idempotent** (inbox table), with **retry + DLQ** (see `@bjm/shared`).
- **Errors:** throw `AppError` subclasses; never swallow errors; the centralised
  handler shapes the response. No `console.log` (use `logger`). No magic strings.
- **Types:** avoid `any` (lint warns). DTOs are separate from domain entities.

## Commands

```bash
npm install            # install workspace deps
npm run build:libs     # build @bjm/contracts and @bjm/shared (needed before dev/build)
npm run build          # build everything
npm test               # run the unit test suite (no infra required)
npm run lint           # eslint
npm run format         # prettier --write
docker compose up --build   # run the full stack (Kafka + 3 Postgres + 3 services)
```

## Testing expectations

Unit tests for use cases and the consumer (validation / idempotency / retry /
DLQ), in-memory repositories for use-case tests, schema tests for contracts.
Tests must run without Kafka or a database.
