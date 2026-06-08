# ADR 0001 — Event-driven microservices with the outbox pattern

- Status: Accepted
- Date: 2026-06-08

## Context

The OMS needs independently deployable services (orders, inventory, picking) that
stay consistent without sharing a database. Synchronous chaining would couple
their availability and create a distributed monolith.

## Decision

- Use **choreographed events over Kafka** for state changes; REST only for
  direct commands/queries.
- Each service **owns its database**; cross-service data flows as events.
- Guarantee delivery with the **transactional outbox** on the write side and an
  **idempotency (inbox) table** on the read side.
- Wrap every event in a shared, **versioned envelope** (`@bjm/contracts`) with
  correlation/causation ids.
- Handle failures with **bounded retries + a Dead Letter Queue** per topic.

## Consequences

- Services are loosely coupled and independently deployable; orders does not need
  inventory to be up to accept an order.
- Delivery is at-least-once; consumers must be (and are) idempotent.
- Operational surface grows: a broker, three databases and DLQ monitoring.
- Eventual consistency: an order is `PENDING` until inventory responds.

## Alternatives considered

- **Synchronous REST orchestration** — simpler to trace but tightly couples
  availability and latency. Rejected.
- **Shared database** — easiest consistency but breaks service autonomy and
  scalability. Rejected.
