# Catálogo de eventos

Todos los eventos comparten el envelope estándar (`@bjm/contracts` →
`DomainEvent`):

```ts
type DomainEvent<TPayload> = {
  eventId: string; // uuid v4, usado para idempotencia
  eventType: string;
  eventVersion: number;
  aggregateId: string; // también es la clave del mensaje de Kafka
  aggregateType: string;
  occurredAt: string; // ISO-8601
  correlationId: string;
  causationId?: string; // eventId que causó este evento
  source: string; // servicio emisor
  payload: TPayload;
};
```

| Topic                                 | eventType                          | Productor | Consumidores    |
| ------------------------------------- | ---------------------------------- | --------- | --------------- |
| `oms.orders.order-created.v1`         | `oms.order.created`                | orders    | inventory       |
| `oms.inventory.stock-reserved.v1`     | `oms.inventory.stock-reserved`     | inventory | orders, picking |
| `oms.inventory.reservation-failed.v1` | `oms.inventory.reservation-failed` | inventory | orders          |
| `oms.picking.picking-assigned.v1`     | `oms.picking.assigned`             | picking   | (terminal)      |

Cada topic tiene un `<topic>.dlq` implícito para mensajes envenenados y
reintentos agotados.

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

## Política de versionado

Un cambio incompatible hacia atrás en un payload se convierte en un **nuevo
topic** (`...v2`) y una nueva `eventVersion`, de modo que los consumidores
existentes siguen funcionando hasta que migren.
