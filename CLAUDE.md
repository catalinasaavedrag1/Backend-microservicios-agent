# CLAUDE.md — Estándares del proyecto

Arquitectura de **referencia para backends de microservicios orientados a
eventos**. **Fastify + Prisma + PostgreSQL + KafkaJS + Zod + Vitest**, como
monorepo con npm workspaces.

No es un dominio concreto: es la estructura, la arquitectura y los estándares de
clean code que debe seguir cualquier servicio. Para la persona completa del
arquitecto y el checklist de revisión de PR ver
[`.claude/agents/backend-architect.md`](.claude/agents/backend-architect.md).

## Estructura

```
packages/
  contracts/   # envelope de eventos, topics y schemas (el ÚNICO contrato entre servicios)
  shared/      # infra transversal: logger, errores, helpers de Kafka, relay de outbox, health, server, OpenAPI
services/
  example-service/   # PLANTILLA: cópiala para crear un servicio nuevo
```

Cada servicio sigue arquitectura limpia:
`domain/` → `application/` (use-cases + ports) → `infrastructure/` (http, persistence, kafka).

## Reglas no negociables

- **Límites de servicio:** cada servicio es dueño de su base de datos; nunca
  consultes la BD de otro servicio. Comunícate vía REST (comandos/consultas) o
  eventos (cambios de estado). Comparte **solo contratos** (`@bjm/contracts`),
  nunca entidades de dominio.
- **Controllers delgados:** validan la entrada (Zod vía `parseWith`) y delegan.
  Sin lógica de negocio en los controllers.
- **El dominio es puro:** sin imports de Prisma/Fastify/Kafka en `domain/`.
- **Eventos versionados** y envueltos en el envelope estándar `DomainEvent` con
  `correlationId` / `causationId`.
- **Mensajería fiable:** las escrituras usan el **outbox transaccional**; los
  consumidores son **idempotentes** (tabla de inbox), con **retry + DLQ** (ver
  `@bjm/shared`).
- **Errores:** lanza subclases de `AppError`; nunca silencies errores; el handler
  central da forma a la respuesta. Sin `console.log` (usa `logger`). Sin strings
  mágicos.
- **Tipos:** evita `any` (el lint lo advierte). Los DTO están separados de las
  entidades de dominio.
- **APIs documentadas:** cada servicio expone OpenAPI en `/docs` (el mismo schema
  Zod valida y documenta).

## Comandos

```bash
npm install            # instala dependencias del workspace
npm run build:libs     # compila @bjm/contracts y @bjm/shared (necesario antes de dev/build)
npm run build          # compila todo
npm test               # ejecuta la suite de tests unitarios (no requiere infra)
npm run lint           # eslint
npm run format         # prettier --write
docker compose up --build   # levanta el stack de referencia (Kafka + Postgres + servicio de ejemplo)
```

## Crear un servicio nuevo

Copia `services/example-service`, renómbralo, reemplaza el módulo `example` por
tu dominio, declara tus eventos en `packages/contracts` y conserva las tablas
`OutboxMessage` y `ProcessedEvent` en tu schema de Prisma.

## Calidad, seguridad y observabilidad

- **CI** (`.github/workflows/ci.yml`): `lint + typecheck + test + format:check +
build` y validación de commits (Conventional Commits + commitlint).
- **Boundaries por lint**: `domain/` no puede importar `application/`,
  `infrastructure/` ni infraestructura; `application/` no importa
  `infrastructure/`. No es convención: lo bloquea ESLint.
- **Seguridad** (`@bjm/shared`): `helmet`, CORS controlado y rate limiting vía
  `buildServer({ security })`; `internalAuth` (API key) para llamadas
  servicio-a-servicio.
- **Observabilidad**: métricas Prometheus en `/metrics` y tracing OpenTelemetry
  opcional (activado por `OTEL_EXPORTER_OTLP_ENDPOINT`). Ver `docs/runbook.md` y
  `docs/slo.md`.
- **Migraciones**: `prisma migrate` en producción (`db push` solo en desarrollo).
- **Apagado**: graceful shutdown (deja de consumir, drena HTTP, cierra conexiones).

## No romper el proyecto

Antes y después de cambiar: corre `lint`, `typecheck`, `test`, `format:check` y
`build`. Busca todos los usos antes de borrar/renombrar. Cambios compatibles
hacia atrás (expand-contract; eventos versionados; migraciones en dos fases). Si
un cambio toca un contrato compartido (API/evento/BD), propágalo a **todos** los
afectados (back, front, BD) y delega lo que salga del backend en el agente
especialista correspondiente.

## Expectativas de testing

Tests unitarios para los use cases y el consumidor (validación / idempotencia /
retry / DLQ), repositorios en memoria para los tests de use cases y tests de
schema para los contratos. Los tests deben correr sin Kafka ni base de datos.
