# Diagramas (modelo C4)

Diagramas en Mermaid, versionados con el código. Renderizan en GitHub.

## Nivel 1 — Contexto

```mermaid
C4Context
  title Sistema backend de microservicios (referencia)
  Person(cliente, "Cliente / Sistema externo", "Consume las APIs REST")
  System(backend, "Backend de microservicios", "Servicios orientados a eventos")
  System_Ext(broker, "Kafka", "Bus de eventos")
  Rel(cliente, backend, "Comandos/consultas", "HTTPS/REST")
  Rel(backend, broker, "Publica/consume eventos", "Kafka")
```

## Nivel 2 — Contenedores

```mermaid
C4Container
  title Contenedores (con la plantilla example-service)
  Person(cliente, "Cliente")
  Container(svc, "example-service", "Node.js/Fastify", "API REST + productor/consumidor")
  ContainerDb(db, "PostgreSQL", "BD propia del servicio", "Agregado + outbox + inbox")
  Container(broker, "Kafka", "KRaft", "Topics + DLQ")
  Container(otel, "Colector OTel / Prometheus", "Observabilidad", "Trazas y métricas")
  Rel(cliente, svc, "REST", "HTTPS")
  Rel(svc, db, "lee/escribe (tx outbox)", "SQL")
  Rel(svc, broker, "publica/consume", "Kafka")
  Rel(svc, otel, "trazas /metrics", "OTLP / scrape")
```

## Nivel 3 — Componentes (clean architecture de un servicio)

```mermaid
flowchart TB
  subgraph infra[infrastructure]
    http[HTTP: controllers/rutas]
    persistence[Persistence: repos Prisma + outbox + inbox]
    kafka[Kafka: consumidores]
  end
  subgraph app[application]
    usecases[Use cases]
    ports[Ports interfaces]
  end
  subgraph domain[domain]
    agg[Agregados + reglas puras]
  end
  http --> usecases
  kafka --> usecases
  usecases --> ports
  usecases --> agg
  persistence -. implementa .-> ports
  http -. valida con .-> agg
```

Regla de dependencias: `infrastructure → application → domain`. El dominio no
importa infraestructura (se hace cumplir por ESLint).
