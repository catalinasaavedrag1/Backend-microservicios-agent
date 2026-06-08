# Picking Service

Fulfilment side of the OMS saga. Creates picking tasks once stock is reserved.

## Responsibilities

- Consume `StockReserved` and create a picking task.
- Emit `PickingAssigned` through the **transactional outbox**.
- Expose REST endpoints to inspect picking tasks.

## API

| Method | Path                      | Description              |
| ------ | ------------------------- | ------------------------ |
| GET    | `/picking-tasks`          | List picking tasks       |
| GET    | `/picking-tasks/:orderId` | Fetch a task by order id |
| GET    | `/health`                 | Liveness probe           |
| GET    | `/ready`                  | Readiness (DB) probe     |

## Events

- **Consumes:** `oms.inventory.stock-reserved.v1`
- **Produces:** `oms.picking.picking-assigned.v1`
