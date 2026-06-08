# Catálogo de eventos

Todos los eventos comparten el envelope estándar (`@bjm/contracts` →
`DomainEvent`). Cada proyecto declara sus propios eventos siguiendo este formato;
aquí se documenta el del servicio de ejemplo como referencia.

```ts
type DomainEvent<TPayload> = {
  eventId: string; // uuid v4, usado para idempotencia
  eventType: string;
  eventVersion: number;
  aggregateId: string; // también es la clave del mensaje de Kafka
  aggregateType: string;
  occurredAt: string; // ISO-8601
  correlationId: string;
  causationId?: string; // eventId que causó este evento
  source: string; // servicio emisor
  payload: TPayload;
};
```

## Convención de topics

`<dominio>.<evento>.v<version>` (helper `topicName(dominio, evento, version)` en
`@bjm/contracts`). Cada topic tiene un `<topic>.dlq` implícito para mensajes
envenenados y reintentos agotados.

| Topic                        | eventType         | Productor       | Consumidores           |
| ---------------------------- | ----------------- | --------------- | ---------------------- |
| `example.example-created.v1` | `example.created` | example-service | example-service (demo) |

## Payload de ejemplo

### `example.created`

```jsonc
{
  "exampleId": "uuid",
  "name": "demo",
}
```

## Política de versionado

Un cambio incompatible hacia atrás en un payload se convierte en un **nuevo
topic** (`...v2`) y una nueva `eventVersion`, de modo que los consumidores
existentes siguen funcionando hasta que migren.
