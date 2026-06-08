# Event Catalog

All events share the standard envelope (`@bjm/contracts` → `DomainEvent`):

```ts
type DomainEvent<TPayload> = {
  eventId: string; // uuid v4, used for idempotency
  eventType: string;
  eventVersion: number;
  aggregateId: string; // also the Kafka message key
  aggregateType: string;
  occurredAt: string; // ISO-8601
  correlationId: string;
  causationId?: string; // eventId that caused this event
  source: string; // emitting service
  payload: TPayload;
};
```

| Topic                                 | eventType                          | Producer  | Consumers       |
| ------------------------------------- | ---------------------------------- | --------- | --------------- |
| `oms.orders.order-created.v1`         | `oms.order.created`                | orders    | inventory       |
| `oms.inventory.stock-reserved.v1`     | `oms.inventory.stock-reserved`     | inventory | orders, picking |
| `oms.inventory.reservation-failed.v1` | `oms.inventory.reservation-failed` | inventory | orders          |
| `oms.picking.picking-assigned.v1`     | `oms.picking.assigned`             | picking   | (terminal)      |

Every topic has an implicit `<topic>.dlq` for poison messages and exhausted
retries.

## Payloads

### `oms.order.created`

```jsonc
{
  "orderId": "uuid",
  "customerId": "string",
  "currency": "CLP",
  "totalAmount": 3980,
  "items": [{ "sku": "SKU-1", "quantity": 2, "unitPrice": 1990 }],
}
```

### `oms.inventory.stock-reserved`

```jsonc
{
  "orderId": "uuid",
  "reservationId": "uuid",
  "items": [{ "sku": "SKU-1", "quantity": 2 }],
}
```

### `oms.inventory.reservation-failed`

```jsonc
{
  "orderId": "uuid",
  "reason": "INSUFFICIENT_STOCK",
  "shortages": [{ "sku": "SKU-1", "requested": 2, "available": 0 }],
}
```

### `oms.picking.assigned`

```jsonc
{
  "orderId": "uuid",
  "pickingTaskId": "uuid",
  "reservationId": "uuid",
  "items": [{ "sku": "SKU-1", "quantity": 2 }],
}
```

## Versioning policy

A backward-incompatible change to a payload becomes a **new topic** (`...v2`) and
a new `eventVersion`, so existing consumers keep working until they migrate.
