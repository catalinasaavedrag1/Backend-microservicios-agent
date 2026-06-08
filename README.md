# Backend Microservices Agent — OMS Event-Driven

Sistema de gestión de pedidos (OMS) orientado a eventos, construido como
referencia para el **Node.js Event-Driven Backend Architect Agent** (ver
[`.claude/agents/backend-architect.md`](.claude/agents/backend-architect.md) y
[`CLAUDE.md`](CLAUDE.md)).

Stack: **TypeScript · Fastify · Prisma · PostgreSQL · KafkaJS · Zod · Vitest ·
ESLint · Prettier · Husky · Docker Compose**.

## Qué contiene

Un monorepo con npm workspaces y tres microservicios desplegables de forma
independiente que colaboran mediante una saga coreografiada sobre Kafka (Outbox +
Idempotencia + Retry + DLQ):

| Servicio            | Puerto | BD propia    | Rol                                    |
| ------------------- | ------ | ------------ | -------------------------------------- |
| `orders-service`    | 3001   | orders DB    | Crea pedidos; confirma/rechaza (saga)  |
| `inventory-service` | 3002   | inventory DB | Reserva stock; emite reservado/fallido |
| `picking-service`   | 3003   | picking DB   | Crea tareas de picking                 |

```
packages/contracts   envelope de eventos, topics y schemas compartidos (contrato entre servicios)
packages/shared      logger, errores, helpers de Kafka, relay de outbox, health, server
services/*           orders · inventory · picking  (clean architecture por servicio)
```

Consulta [`docs/architecture.md`](docs/architecture.md) para el flujo de la saga
y [`docs/event-catalog.md`](docs/event-catalog.md) para todos los eventos.

## Inicio rápido (Docker)

```bash
docker compose up --build
# Levanta Kafka + 3 Postgres + 3 servicios; los esquemas se aplican al arrancar.
```

Carga algo de stock y dispara la saga:

```bash
# 1. dar stock al inventario
curl -X PUT http://localhost:3002/stock -H 'content-type: application/json' \
  -d '{ "sku": "SKU-1", "available": 100 }'

# 2. crear un pedido (dispara order.created -> stock-reserved -> confirma + picking)
curl -X POST http://localhost:3001/orders -H 'content-type: application/json' \
  -d '{ "customerId": "cust-1", "currency": "CLP",
        "items": [{ "sku": "SKU-1", "quantity": 2, "unitPrice": 1990 }] }'

# 3. observar los resultados
curl http://localhost:3001/orders/<orderId>     # status: CONFIRMED
curl http://localhost:3003/picking-tasks        # se creó una tarea
```

Pide más unidades de las disponibles para ver la ruta de **compensación**
(`reservation-failed` → pedido `REJECTED`).

## Desarrollo local (sin Docker)

```bash
npm install
npm run build:libs        # compila primero @bjm/contracts y @bjm/shared
npm test                  # tests unitarios (no requieren infraestructura)

# ejecutar un solo servicio contra un Postgres + Kafka locales (ver cada .env.example)
npm run dev -w @bjm/orders-service
```

## Scripts útiles

| Comando             | Descripción                        |
| ------------------- | ---------------------------------- |
| `npm run build`     | Compila librerías y servicios      |
| `npm test`          | Ejecuta la suite de Vitest         |
| `npm run lint`      | Linting con ESLint                 |
| `npm run format`    | Formateo con Prettier              |
| `npm run typecheck` | Chequeo de tipos en cada workspace |

## Controles de calidad

- **Husky + lint-staged** ejecutan ESLint y Prettier sobre los archivos en stage
  antes de cada commit.
- ESLint prohíbe `console.log`, exige `eqeqeq` y marca `any`.
- Los límites de la arquitectura limpia y los patrones de fiabilidad están
  documentados en [`CLAUDE.md`](CLAUDE.md).
