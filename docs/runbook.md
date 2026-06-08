# Runbook de incidentes

Guía operativa para los incidentes más comunes en servicios event-driven.

## Señales y dónde mirar

- **Logs** estructurados (JSON) con `correlationId` / `eventId`.
- **Métricas** Prometheus en `/metrics` (latencia HTTP, CPU/memoria, event loop).
- **Trazas** OpenTelemetry (si `OTEL_EXPORTER_OTLP_ENDPOINT` está configurado).
- **Health**: `/health` (liveness) y `/ready` (readiness, incluye BD).

## La DLQ está creciendo

Síntoma: mensajes acumulándose en `<topic>.dlq`.

1. Inspecciona las cabeceras del mensaje en la DLQ: `dlq-reason`,
   `dlq-error`, `dlq-origin-topic`, `dlq-at`.
2. Si `dlq-reason = SCHEMA_VALIDATION_FAILED`: el productor emitió un evento
   inválido o incompatible. Revisa la versión del evento y el contrato.
3. Si `dlq-reason = HANDLER_FAILED`: fallo de procesamiento (BD caída, bug).
   Corrige la causa raíz.
4. **Reproceso**: una vez corregida la causa, reinyecta los mensajes de la DLQ
   al topic original (herramienta de reproceso / consumidor dedicado). El
   consumo es idempotente, así que reprocesar es seguro.

## Un consumidor está detenido / con lag alto

1. Revisa logs del servicio: ¿excepciones, reconexión a Kafka, BD lenta?
2. Verifica `/ready` y la conectividad con Kafka y PostgreSQL.
3. Revisa el lag del consumer group. Si la carga es alta, aumenta particiones y
   réplicas del consumidor (consumer group escala horizontalmente).
4. Si está atascado en un mensaje, confirma que tras `maxRetries` va a la DLQ y
   no bloquea la partición.

## Eventos que no se publican

1. Revisa la tabla `outbox_messages`: ¿hay filas con `publishedAt = null`
   acumulándose?
2. Verifica que el **OutboxRelay** esté corriendo (log "outbox relay started") y
   que el productor de Kafka esté conectado.
3. Revisa errores del relay ("outbox relay tick failed").

## Latencia/errores HTTP elevados

1. Mira el histograma `http_request_duration_seconds` por ruta y código.
2. Revisa la salud de la BD (`/ready`) y los pools de conexión.
3. Si es saturación, revisa el rate limit y escala réplicas.

## Apagado / despliegue

- El servicio hace **graceful shutdown**: deja de consumir, drena HTTP en vuelo
  y cierra conexiones. Da margen de `terminationGracePeriod` suficiente.
- Migraciones: usa `prisma migrate deploy` en el arranque del despliegue (no
  `db push` en producción).
