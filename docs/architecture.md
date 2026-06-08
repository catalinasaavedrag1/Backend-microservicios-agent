# Arquitectura

Este repositorio es una **arquitectura de referencia** para backends de
microservicios orientados a eventos. Define la estructura, los patrones y los
estándares; el dominio concreto lo aporta cada proyecto copiando la plantilla
`services/example-service`.

## Principios

- Cada servicio es **dueño de su base de datos** y se despliega de forma
  independiente.
- Los servicios se comunican por **eventos** (cambios de estado, vía Kafka) y
  **REST** (comandos/consultas directas).
- Se comparten **solo contratos** (`@bjm/contracts`), nunca entidades internas.
- Se evita el "monolito distribuido": ningún servicio depende del tiempo de
  ejecución de otro para operar.

## Estructura de un servicio (clean architecture)

```
services/<servicio>/
  src/
    config/            # env (Zod), database (Prisma), kafka
    modules/<dominio>/
      domain/          # agregados y reglas puras (sin infra)
      application/
        ports/         # interfaces (repositorios, etc.)
        use-cases/     # orquestan dominio + ports
      infrastructure/
        http/          # controllers, rutas, schemas
        persistence/   # repositorios Prisma, mappers, outbox, idempotencia
        kafka/         # consumidores
      <dominio>.module.ts   # raíz de composición (cablea dependencias)
    main.ts            # arranque: producer/consumer, outbox relay, server
  prisma/schema.prisma # agregado + OutboxMessage + ProcessedEvent
```

Dependencias permitidas: `infrastructure` → `application` → `domain`. El dominio
no importa nada de infraestructura.

## Patrones de fiabilidad (en `@bjm/shared`)

- **Outbox transaccional** — los eventos se escriben en la misma transacción de
  BD que el cambio del agregado y luego un relay los publica en Kafka. No se
  pierden eventos ante una caída.
- **Consumidores idempotentes** — cada `eventId` consumido se registra en una
  tabla de inbox (`processed_events`); las reentregas se omiten.
- **Retry + Dead Letter Queue** — los handlers reintentan con backoff
  exponencial; los mensajes envenenados (schema inválido) y los reintentos
  agotados se enrutan a `<topic>.dlq`.
- **Correlation / causation ids** — se propagan desde HTTP a través de cada
  evento para trazabilidad de punta a punta.
- **Orden por agregado** — el id del agregado se usa como clave del mensaje, de
  modo que los eventos del mismo agregado caen en la misma partición.

## El servicio de ejemplo

`services/example-service` demuestra el ciclo completo sobre un agregado neutro
`Example`:

1. `POST /examples` persiste un `Example` (estado `DRAFT`) y un evento
   `ExampleCreated` en el outbox, en una sola transacción.
2. El relay del outbox publica `example.created` en Kafka.
3. El consumidor (idempotente) recibe `example.created` y publica el agregado
   (estado `PUBLISHED`).

Es deliberadamente trivial: su valor es servir de **molde** para un servicio
real, no representar un dominio concreto.

## Compromisos / próximos pasos

- La entrega es al-menos-una-vez; la idempotencia hace que los efectos sean
  exactamente-una-vez. Para garantías más fuertes, integra la inserción en el
  inbox dentro de la propia transacción del handler.
- Un despliegue real debería reemplazar `prisma db push` por
  `prisma migrate deploy`, añadir un schema registry, tracing distribuido
  (OpenTelemetry) y alertas de DLQ.
