# ADR 0001 — Microservicios orientados a eventos con patrón outbox

- Estado: Aceptado
- Fecha: 2026-06-08

## Contexto

El OMS necesita servicios desplegables de forma independiente (orders, inventory,
picking) que se mantengan consistentes sin compartir una base de datos. El
encadenamiento síncrono acoplaría su disponibilidad y crearía un monolito
distribuido.

## Decisión

- Usar **eventos coreografiados sobre Kafka** para los cambios de estado; REST
  solo para comandos/consultas directas.
- Cada servicio es **dueño de su base de datos**; los datos entre servicios
  fluyen como eventos.
- Garantizar la entrega con el **outbox transaccional** en el lado de escritura y
  una **tabla de idempotencia (inbox)** en el lado de lectura.
- Envolver cada evento en un envelope compartido y **versionado**
  (`@bjm/contracts`) con ids de correlación/causación.
- Manejar fallos con **reintentos acotados + una Dead Letter Queue** por topic.

## Consecuencias

- Los servicios quedan débilmente acoplados y se despliegan de forma
  independiente; orders no necesita que inventory esté disponible para aceptar un
  pedido.
- La entrega es al-menos-una-vez; los consumidores deben ser (y son)
  idempotentes.
- Crece la superficie operativa: un broker, tres bases de datos y monitoreo de
  DLQ.
- Consistencia eventual: un pedido queda en `PENDING` hasta que inventory
  responde.

## Alternativas consideradas

- **Orquestación REST síncrona** — más simple de trazar pero acopla fuertemente
  disponibilidad y latencia. Rechazada.
- **Base de datos compartida** — la consistencia más fácil pero rompe la
  autonomía y escalabilidad de los servicios. Rechazada.
