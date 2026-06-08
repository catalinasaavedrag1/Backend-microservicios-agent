# Architecture

## Overview

Three independently deployable microservices implement an Order Management saga.
Each service owns its own PostgreSQL database and communicates only through Kafka
events (state changes) and REST (commands/queries). The single shared artifact
is `@bjm/contracts` (event envelope + schemas + topic names).

```
                 POST /orders
                      │
                      ▼
            ┌───────────────────┐    order.created     ┌──────────────────────┐
            │   orders-service   │ ───────────────────▶ │  inventory-service    │
            │  (orders DB)       │                      │  (inventory DB)       │
            │                    │ ◀─────────────────── │                       │
            └───────────────────┘  stock-reserved /     └──────────────────────┘
                      ▲             reservation-failed              │
                      │                                             │ stock-reserved
        confirm/reject (saga)                                       ▼
                                                       ┌──────────────────────┐
                                                       │   picking-service     │
                                                       │   (picking DB)        │
                                                       └──────────────────────┘
                                                                  │ picking-assigned
                                                                  ▼
```

## Saga flow (choreography)

1. **Create order** — `POST /orders` persists an `Order` (status `PENDING`) and
   an `OrderCreated` row in the outbox, in one transaction.
2. **Publish** — the outbox relay publishes `order.created` to Kafka.
3. **Reserve stock** — inventory consumes `order.created` and, in one
   transaction, either reserves stock + emits `stock-reserved`, or emits
   `reservation-failed` with shortages.
4. **Advance / compensate** — orders consumes the result:
   `stock-reserved → CONFIRMED`, `reservation-failed → REJECTED`.
5. **Fulfil** — picking consumes `stock-reserved`, creates a picking task and
   emits `picking-assigned`.

## Reliability patterns

- **Transactional Outbox** — events are written in the same DB transaction as the
  aggregate change, then relayed to Kafka. No lost events on crash.
- **Idempotent consumers** — each consumed `eventId` is recorded in an inbox
  (`processed_events`) table; redeliveries are skipped.
- **Retry + Dead Letter Queue** — handlers retry with exponential backoff; poison
  messages (schema-invalid) and exhausted retries are routed to `<topic>.dlq`.
- **Correlation / causation ids** — propagated from HTTP through every event for
  end-to-end tracing.

## Per-aggregate ordering

The aggregate id is used as the Kafka message key, so all events for an order
land on the same partition and are processed in order.

## Trade-offs / next steps

- Delivery is at-least-once; idempotency makes effects exactly-once. For stronger
  guarantees, fold the inbox insert into the handler's own transaction.
- A real deployment should replace `prisma db push` with `prisma migrate deploy`,
  add a schema registry, distributed tracing (OpenTelemetry) and DLQ alerting.
