# SLOs / SLIs (referencia)

Objetivos de nivel de servicio sugeridos por microservicio. Ajústalos a cada
dominio; lo importante es **medirlos** (métricas en `/metrics`) y definir un
**error budget**.

## Indicadores (SLIs)

| SLI                 | Fuente                                         |
| ------------------- | ---------------------------------------------- |
| Disponibilidad API  | ratio de respuestas no-5xx                     |
| Latencia API (p99)  | `http_request_duration_seconds`                |
| Frescura de eventos | retraso entre `occurredAt` y el consumo        |
| Lag de consumidores | offset lag del consumer group                  |
| Tasa de DLQ         | mensajes a `<topic>.dlq` / mensajes procesados |

## Objetivos (SLOs) sugeridos

| SLO                       | Objetivo         |
| ------------------------- | ---------------- |
| Disponibilidad API        | ≥ 99.9 % mensual |
| Latencia p99 (lectura)    | < 300 ms         |
| Latencia p99 (escritura)  | < 800 ms         |
| Frescura de eventos (p95) | < 5 s            |
| Tasa de DLQ               | < 0.1 %          |

## Error budget

Con 99.9 % de disponibilidad mensual, el presupuesto de error es ~43 min/mes. Si
se consume, se congelan cambios de riesgo y se prioriza fiabilidad sobre features.

## Alertas recomendadas

- DLQ con tendencia creciente o tasa > umbral.
- Lag de consumidor por encima de umbral durante N minutos.
- Latencia p99 fuera de objetivo.
- `/ready` fallando (dependencia caída).
