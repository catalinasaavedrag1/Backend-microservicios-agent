# ADR 0002 — Calidad, observabilidad y seguridad de la plataforma

- Estado: Aceptado
- Fecha: 2026-06-08

## Contexto

La arquitectura de referencia necesita garantías de nivel producción más allá de
la estructura de código: que los cambios no rompan el proyecto, y que cada
servicio sea seguro y observable por defecto.

## Decisión

- **CI obligatoria** (GitHub Actions): `lint + typecheck + test + format:check +
build` en cada push/PR, más validación de mensajes de commit (Conventional
  Commits con commitlint).
- **Boundaries por lint**: ESLint prohíbe que `domain/` importe `application/`,
  `infrastructure/` o dependencias de infraestructura; y que `application/`
  importe `infrastructure/`. La clean architecture deja de ser solo convención.
- **Seguridad por defecto** en `@bjm/shared`: `helmet`, CORS controlado y rate
  limiting; helper `internalAuth` (API key) para llamadas servicio-a-servicio.
- **Observabilidad por defecto**: métricas Prometheus en `/metrics` y tracing
  OpenTelemetry opcional (activado por `OTEL_EXPORTER_OTLP_ENDPOINT`).
- **Migraciones versionadas**: `prisma migrate` para producción (`db push` solo
  en desarrollo de la plantilla).
- **Graceful shutdown**: dejar de consumir, drenar HTTP y cerrar conexiones.

## Consecuencias

- Mayor confianza: un cambio que rompe tipos, tests, formato o boundaries no
  pasa CI.
- Servicios seguros y medibles desde el primer día.
- Algo más de superficie operativa (colector OTel/Prometheus) y dependencias.

## Alternativas consideradas

- **Solo convenciones documentadas** (sin enforcement) — frágil; se erosiona con
  el tiempo. Rechazada.
- **Observabilidad ad-hoc por servicio** — inconsistente; mejor centralizar en el
  toolkit. Rechazada.
