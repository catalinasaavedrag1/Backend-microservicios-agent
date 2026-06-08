import type { OutboxEvent } from '../../application/ports/InventoryRepository';

export function toOutboxRow(event: OutboxEvent) {
  return {
    eventId: event.eventId,
    topic: event.topic,
    eventType: event.eventType,
    eventVersion: event.eventVersion,
    aggregateId: event.aggregateId,
    aggregateType: event.aggregateType,
    correlationId: event.correlationId,
    causationId: event.causationId ?? null,
    payload: event.payload as object,
  };
}
