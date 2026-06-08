# CLAUDE.md — Estándares del proyecto

Microservicios OMS orientados a eventos. **Fastify + Prisma + PostgreSQL +
KafkaJS + Zod + Vitest**, organizados como monorepo con npm workspaces.

Para la persona completa del arquitecto y el checklist de revisión de PR ver
[`.claude/agents/backend-architect.md`](.claude/agents/backend-architect.md).

## Estructura

```
packages/
  contracts/   # envelope de eventos, topics y schemas (el ÚNICO contrato entre servicios)
  shared/      # infra transversal: logger, errores, helpers de Kafka, relay de outbox, health, server
services/
  orders/      # lado de comandos: crea pedidos, reacciona a eventos de inventario
  inventory/   # reserva stock, emite reservado/fallido
  picking/     # crea tareas de picking cuando el stock queda reservado
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

## Comandos

```bash
npm install            # instala dependencias del workspace
npm run build:libs     # compila @bjm/contracts y @bjm/shared (necesario antes de dev/build)
npm run build          # compila todo
npm test               # ejecuta la suite de tests unitarios (no requiere infra)
npm run lint           # eslint
npm run format         # prettier --write
docker compose up --build   # levanta todo el stack (Kafka + 3 Postgres + 3 servicios)
```

## Expectativas de testing

Tests unitarios para los use cases y el consumidor (validación / idempotencia /
retry / DLQ), repositorios en memoria para los tests de use cases y tests de
schema para los contratos. Los tests deben correr sin Kafka ni base de datos.
