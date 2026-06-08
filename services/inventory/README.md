# Inventory Service

Lado de reserva de stock de la saga OMS. Es dueño de los niveles de stock y de
las reservas.

## Responsabilidades

- Consumir `OrderCreated` e intentar reservar stock de forma atómica.
- Emitir `StockReserved` en caso de éxito o `ReservationFailed` (con los
  faltantes) en caso de fallo, ambos a través del **outbox transaccional**.
- Exponer endpoints REST para inspeccionar y ajustar el stock.

## API

| Método | Ruta      | Descripción             |
| ------ | --------- | ----------------------- |
| GET    | `/stock`  | Listar niveles de stock |
| PUT    | `/stock`  | Crear/actualizar un SKU |
| GET    | `/health` | Sonda de liveness       |
| GET    | `/ready`  | Sonda de readiness (BD) |

```bash
curl -X PUT http://localhost:3002/stock \
  -H 'content-type: application/json' \
  -d '{ "sku": "SKU-1", "available": 100 }'
```

## Eventos

- **Consume:** `oms.orders.order-created.v1`
- **Produce:** `oms.inventory.stock-reserved.v1`, `oms.inventory.reservation-failed.v1`

## Seed

```bash
npm run db:push -w @bjm/inventory-service
npm run db:seed -w @bjm/inventory-service
```
