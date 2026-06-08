import type { Producer } from 'kafkajs';
import type { DomainEvent } from '@bjm/contracts';
import { newId } from '../ids';
import { logger } from '../logger/logger';

export interface PublishInput<TPayload> {
  topic: string;
  eventType: string;
  eventVersion: number;
  aggregateId: string;
  aggregateType: string;
  payload: TPayload;
  correlationId: string;
  causationId?: string;
  /** Pre-assigned event id (used when relaying from the outbox to stay idempotent). */
  eventId?: string;
}

/**
 * Wraps a payload in the standard {@link DomainEvent} envelope and publishes it.
 * The aggregate id is used as the Kafka message key so all events for the same
 * aggregate land on the same partition (preserving per-aggregate ordering).
 */
export class EventPublisher {
  constructor(
    private readonly producer: Producer,
    private readonly source: string,
  ) {}

  async publish<TPayload>(input: PublishInput<TPayload>): Promise<DomainEvent<TPayload>> {
    const event: DomainEvent<TPayload> = {
      eventId: input.eventId ?? newId(),
      eventType: input.eventType,
      eventVersion: input.eventVersion,
      aggregateId: input.aggregateId,
      aggregateType: input.aggregateType,
      occurredAt: new Date().toISOString(),
      correlationId: input.correlationId,
      ...(input.causationId ? { causationId: input.causationId } : {}),
      source: this.source,
      payload: input.payload,
    };

    await this.producer.send({
      topic: input.topic,
      messages: [
        {
          key: event.aggregateId,
          value: JSON.stringify(event),
          headers: {
            'event-id': event.eventId,
            'event-type': event.eventType,
            'event-version': String(event.eventVersion),
            'correlation-id': event.correlationId,
            ...(event.causationId ? { 'causation-id': event.causationId } : {}),
          },
        },
      ],
    });

    logger.info(
      {
        topic: input.topic,
        eventType: event.eventType,
        eventId: event.eventId,
        correlationId: event.correlationId,
      },
      'event published',
    );

    return event;
  }
}
