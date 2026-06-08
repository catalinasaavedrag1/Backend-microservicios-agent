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

## API REST (versionada en `/api/v1`)

| Método | Ruta                   | Descripción                | Códigos       |
| ------ | ---------------------- | -------------------------- | ------------- |
| POST   | `/api/v1/examples`     | Crear un example           | 201, 400      |
| GET    | `/api/v1/examples`     | Listar examples (paginado) | 200           |
| GET    | `/api/v1/examples/:id` | Obtener un example         | 200, 404      |
| PATCH  | `/api/v1/examples/:id` | Renombrar un example       | 200, 400, 404 |
| DELETE | `/api/v1/examples/:id` | Eliminar un example        | 204, 404      |
| GET    | `/docs`                | Swagger UI (OpenAPI)       |               |
| GET    | `/metrics`             | Métricas Prometheus        |               |
| GET    | `/health` / `/ready`   | Liveness / readiness (BD)  |               |

Paginación: `?page=1&pageSize=20` (la lista devuelve `{ items, page, pageSize, total }`).
Errores con envelope consistente: `{ "error": { "code", "message", "details" } }`.

```bash
# crear
curl -X POST http://localhost:3001/api/v1/examples \
  -H 'content-type: application/json' -d '{ "name": "demo" }'

# listar (paginado)
curl 'http://localhost:3001/api/v1/examples?page=1&pageSize=20'

# obtener
curl http://localhost:3001/api/v1/examples/<id>

# renombrar
curl -X PATCH http://localhost:3001/api/v1/examples/<id> \
  -H 'content-type: application/json' -d '{ "name": "nuevo" }'

# eliminar
curl -X DELETE http://localhost:3001/api/v1/examples/<id>
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
