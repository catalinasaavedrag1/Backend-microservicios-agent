import { Example } from '../../domain/Example';
import type { ExampleStatus } from '../../domain/ExampleStatus';
import type { OutboxEvent } from '../../application/ports/ExampleRepository';

interface ExampleRow {
  id: string;
  name: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export const ExampleMapper = {
  toDomain(row: ExampleRow): Example {
    return Example.rehydrate({
      id: row.id,
      name: row.name,
      status: row.status as ExampleStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  },

  toOutboxRow(event: OutboxEvent) {
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
  },
};
