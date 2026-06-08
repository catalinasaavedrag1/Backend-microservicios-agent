# Orders Service

Lado de comandos de la saga OMS. Es dueño del agregado `Order` y su ciclo de
vida.

## Responsabilidades

- Exponer endpoints REST para crear y leer pedidos.
- Emitir `OrderCreated` a través del **outbox transaccional**.
- Reaccionar a los eventos de inventario para avanzar la saga:
  - `StockReserved` → confirmar el pedido.
  - `ReservationFailed` → rechazar el pedido (compensación).

## API

| Método | Ruta          | Descripción             |
| ------ | ------------- | ----------------------- |
| POST   | `/orders`     | Crear un pedido         |
| GET    | `/orders/:id` | Obtener un pedido       |
| GET    | `/health`     | Sonda de liveness       |
| GET    | `/ready`      | Sonda de readiness (BD) |

### Crear pedido

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

## Eventos

- **Produce:** `oms.orders.order-created.v1`
- **Consume:** `oms.inventory.stock-reserved.v1`, `oms.inventory.reservation-failed.v1`

## Desarrollo local

```bash
npm install                 # desde la raíz del repo
npm run build:libs          # compila @bjm/contracts y @bjm/shared
npm run dev -w @bjm/orders-service
```

Las variables de entorno están documentadas en `.env.example`.
