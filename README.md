# Backend Microservices — Arquitectura de referencia

Plantilla y toolkit de referencia para **cualquier proyecto backend de
microservicios orientado a eventos**. No es un producto concreto: define la
**estructura, la arquitectura y los estándares de clean code** que debe seguir un
servicio, junto con un **agente arquitecto/revisor** (ver
[`.claude/agents/backend-architect.md`](.claude/agents/backend-architect.md) y
[`CLAUDE.md`](CLAUDE.md)).

Stack de referencia: **TypeScript · Fastify · Prisma · PostgreSQL · KafkaJS ·
Zod · Vitest · ESLint · Prettier · Husky · OpenAPI · Docker Compose**.

## Qué contiene

Un monorepo con npm workspaces:

| Pieza                      | Qué es                                                                                                                                                          |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/contracts`       | Envelope de evento genérico, convención de topics y schemas (contratos)                                                                                         |
| `packages/shared`          | Toolkit reutilizable: logger, errores, validación, Kafka (publisher/consumer con retry + DLQ + idempotencia), relay de outbox, health, server builder y OpenAPI |
| `services/example-service` | **Plantilla** de microservicio que copias para crear uno nuevo                                                                                                  |

`packages/shared` y `packages/contracts` se reutilizan tal cual en cualquier
proyecto; `services/example-service` es el **molde** que muestra la arquitectura
limpia y los patrones de fiabilidad sobre un dominio neutro.

```
packages/contracts   envelope de eventos, topics y schemas (compartir solo contratos)
packages/shared      logger, errores, helpers de Kafka, relay de outbox, health, server, OpenAPI
services/example-service   plantilla con clean architecture (domain → application → infrastructure)
```

Consulta [`docs/architecture.md`](docs/architecture.md) para la estructura y los
patrones, y [`docs/event-catalog.md`](docs/event-catalog.md) para el formato de
eventos.

## Crear un servicio nuevo

1. Copia `services/example-service` a `services/<tu-servicio>`.
2. Renombra el paquete (`@bjm/<tu-servicio>`).
3. Reemplaza el módulo `example` por tu dominio (agregado, use cases, repos).
4. Declara tus eventos en `packages/contracts` y tus topics en `topics.ts`.
5. Ajusta `prisma/schema.prisma` (conserva `OutboxMessage` y `ProcessedEvent`).
6. Añade el servicio a `docker-compose.yml`.

## Inicio rápido (Docker)

```bash
docker compose up --build
# Levanta Kafka + Postgres + el servicio de ejemplo; el esquema se aplica al arrancar.
```

```bash
# crear un recurso (dispara example.created -> outbox -> consumo idempotente -> PUBLISHED)
curl -X POST http://localhost:3001/examples -H 'content-type: application/json' \
  -d '{ "name": "demo" }'

# documentación OpenAPI
open http://localhost:3001/docs
```

## Desarrollo local (sin Docker)

```bash
npm install
npm run build:libs        # compila primero @bjm/contracts y @bjm/shared
npm test                  # tests unitarios (no requieren infraestructura)

npm run dev -w @bjm/example-service
```

## Scripts útiles

| Comando             | Descripción                        |
| ------------------- | ---------------------------------- |
| `npm run build`     | Compila librerías y el servicio    |
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
