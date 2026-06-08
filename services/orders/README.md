# Orders Service

Command side of the OMS saga. Owns the `Order` aggregate and its lifecycle.

## Responsibilities

- Expose REST endpoints to create and read orders.
- Emit `OrderCreated` via the **transactional outbox**.
- React to inventory events to advance the saga:
  - `StockReserved` → confirm order.
  - `ReservationFailed` → reject order (compensation).

## API

| Method | Path          | Description          |
| ------ | ------------- | -------------------- |
| POST   | `/orders`     | Create an order      |
| GET    | `/orders/:id` | Fetch an order       |
| GET    | `/health`     | Liveness probe       |
| GET    | `/ready`      | Readiness (DB) probe |

### Create order

```bash
curl -X POST http://localhost:3001/orders \
  -H 'content-type: application/json' \
  -H 'x-correlation-id: demo-1' \
  -d '{
    "customerId": "cust-1",
    "currency": "CLP",
    "items": [{ "sku": "SKU-1", "quantity": 2, "unitPrice": 1990 }]
  }'
```

## Events

- **Produces:** `oms.orders.order-created.v1`
- **Consumes:** `oms.inventory.stock-reserved.v1`, `oms.inventory.reservation-failed.v1`

## Local development

```bash
npm install                 # from the repo root
npm run build:libs          # build @bjm/contracts and @bjm/shared
npm run dev -w @bjm/orders-service
```

Environment variables are documented in `.env.example`.
