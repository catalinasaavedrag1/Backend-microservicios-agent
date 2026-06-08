# Picking Service

Lado de cumplimiento (fulfilment) de la saga OMS. Crea tareas de picking una vez
que el stock queda reservado.

## Responsabilidades

- Consumir `StockReserved` y crear una tarea de picking.
- Emitir `PickingAssigned` a través del **outbox transaccional**.
- Exponer endpoints REST para inspeccionar las tareas de picking.

## API

| Método | Ruta                      | Descripción                  |
| ------ | ------------------------- | ---------------------------- |
| GET    | `/picking-tasks`          | Listar tareas de picking     |
| GET    | `/picking-tasks/:orderId` | Obtener una tarea por pedido |
| GET    | `/health`                 | Sonda de liveness            |
| GET    | `/ready`                  | Sonda de readiness (BD)      |

## Eventos

- **Consume:** `oms.inventory.stock-reserved.v1`
- **Produce:** `oms.picking.picking-assigned.v1`
