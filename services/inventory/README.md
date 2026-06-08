# Inventory Service

Stock reservation side of the OMS saga. Owns stock levels and reservations.

## Responsibilities

- Consume `OrderCreated` and attempt to reserve stock atomically.
- Emit `StockReserved` on success or `ReservationFailed` (with shortages) on
  failure, both through the **transactional outbox**.
- Expose REST endpoints to inspect and adjust stock.

## API

| Method | Path      | Description            |
| ------ | --------- | ---------------------- |
| GET    | `/stock`  | List stock levels      |
| PUT    | `/stock`  | Upsert stock for a SKU |
| GET    | `/health` | Liveness probe         |
| GET    | `/ready`  | Readiness (DB) probe   |

```bash
curl -X PUT http://localhost:3002/stock \
  -H 'content-type: application/json' \
  -d '{ "sku": "SKU-1", "available": 100 }'
```

## Events

- **Consumes:** `oms.orders.order-created.v1`
- **Produces:** `oms.inventory.stock-reserved.v1`, `oms.inventory.reservation-failed.v1`

## Seed

```bash
npm run db:push -w @bjm/inventory-service
npm run db:seed -w @bjm/inventory-service
```
