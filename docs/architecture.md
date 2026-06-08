# Arquitectura

## Visión general

Tres microservicios desplegables de forma independiente implementan una saga de
gestión de pedidos. Cada servicio es dueño de su propia base de datos PostgreSQL
y se comunica únicamente a través de eventos de Kafka (cambios de estado) y REST
(comandos/consultas). El único artefacto compartido es `@bjm/contracts` (envelope
de eventos + schemas + nombres de topics).

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
        confirmar/rechazar (saga)                                   ▼
                                                       ┌──────────────────────┐
                                                       │   picking-service     │
                                                       │   (picking DB)        │
                                                       └──────────────────────┘
                                                                  │ picking-assigned
                                                                  ▼
```

## Flujo de la saga (coreografía)

1. **Crear pedido** — `POST /orders` persiste un `Order` (estado `PENDING`) y una
   fila `OrderCreated` en el outbox, en una sola transacción.
2. **Publicar** — el relay del outbox publica `order.created` en Kafka.
3. **Reservar stock** — inventory consume `order.created` y, en una transacción,
   o bien reserva stock + emite `stock-reserved`, o bien emite
   `reservation-failed` con los faltantes.
4. **Avanzar / compensar** — orders consume el resultado:
   `stock-reserved → CONFIRMED`, `reservation-failed → REJECTED`.
5. **Cumplir** — picking consume `stock-reserved`, crea una tarea de picking y
   emite `picking-assigned`.

## Patrones de fiabilidad

- **Outbox transaccional** — los eventos se escriben en la misma transacción de
  BD que el cambio del agregado y luego se relevan a Kafka. No se pierden eventos
  ante una caída.
- **Consumidores idempotentes** — cada `eventId` consumido se registra en una
  tabla de inbox (`processed_events`); las reentregas se omiten.
- **Retry + Dead Letter Queue** — los handlers reintentan con backoff
  exponencial; los mensajes envenenados (schema inválido) y los reintentos
  agotados se enrutan a `<topic>.dlq`.
- **Correlation / causation ids** — se propagan desde HTTP a través de cada
  evento para trazabilidad de punta a punta.

## Orden por agregado

El id del agregado se usa como clave del mensaje de Kafka, de modo que todos los
eventos de un pedido caen en la misma partición y se procesan en orden.

## Compromisos / próximos pasos

- La entrega es al-menos-una-vez; la idempotencia hace que los efectos sean
  exactamente-una-vez. Para garantías más fuertes, integra la inserción en el
  inbox dentro de la propia transacción del handler.
- Un despliegue real debería reemplazar `prisma db push` por
  `prisma migrate deploy`, añadir un schema registry, tracing distribuido
  (OpenTelemetry) y alertas de DLQ.
