# Example Service (plantilla)

Plantilla genérica de microservicio. **No es un dominio real**: es el molde que
copias para crear un servicio nuevo. Demuestra la arquitectura limpia y todos los
patrones de fiabilidad del proyecto sobre un agregado neutro `Example`.

## Qué demuestra

- **Arquitectura limpia:** `domain/` → `application/` (use-cases + ports) →
  `infrastructure/` (http, persistence, kafka).
- **Validación con Zod** reutilizada para validar y para documentar OpenAPI.
- **Outbox transaccional:** `POST /examples` persiste el agregado y el evento
  `ExampleCreated` en una sola transacción.
- **Consumidor idempotente:** consume `ExampleCreated` y publica el agregado
  (con retry + DLQ vía `@bjm/shared`).
- **OpenAPI** en `/docs`, **health/readiness** en `/health` y `/ready`.

## API

| Método | Ruta            | Descripción             |
| ------ | --------------- | ----------------------- |
| POST   | `/examples`     | Crear un example        |
| GET    | `/examples/:id` | Obtener un example      |
| GET    | `/docs`         | Swagger UI (OpenAPI)    |
| GET    | `/health`       | Sonda de liveness       |
| GET    | `/ready`        | Sonda de readiness (BD) |

```bash
curl -X POST http://localhost:3001/examples \
  -H 'content-type: application/json' \
  -d '{ "name": "demo" }'
```

## Cómo crear un servicio nuevo a partir de esta plantilla

1. Copia `services/example-service` a `services/<tu-servicio>`.
2. Renombra el paquete en `package.json` (`@bjm/<tu-servicio>`).
3. Reemplaza el módulo `example` por tu dominio (agregado, use cases, repos).
4. Declara tus eventos en `packages/contracts` y tus topics en `topics.ts`.
5. Ajusta `prisma/schema.prisma` (mantén `OutboxMessage` y `ProcessedEvent`).
6. Añade el servicio a `docker-compose.yml`.

## Eventos

- **Produce:** `example.example-created.v1`
- **Consume:** `example.example-created.v1` (a modo de demostración)
