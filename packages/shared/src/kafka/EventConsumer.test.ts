import { describe, expect, it, vi } from 'vitest';
import type { Consumer, EachMessagePayload, Producer } from 'kafkajs';
import { ExampleCreatedEventSchema, Topics, type ExampleCreatedEvent } from '@bjm/contracts';
import { EventConsumer, type ConsumerHandler } from './EventConsumer';
import type { IdempotencyStore } from './IdempotencyStore';

const validEvent: ExampleCreatedEvent = {
  eventId: '11111111-1111-1111-1111-111111111111',
  eventType: 'example.created',
  eventVersion: 1,
  aggregateId: '22222222-2222-2222-2222-222222222222',
  aggregateType: 'Example',
  occurredAt: '2026-06-08T00:00:00.000Z',
  correlationId: 'corr-1',
  source: 'example-service',
  payload: {
    exampleId: '22222222-2222-2222-2222-222222222222',
    name: 'demo',
  },
};

function payloadFor(value: unknown): EachMessagePayload {
  return {
    topic: Topics.ExampleCreated,
    partition: 0,
    message: {
      key: Buffer.from('key'),
      value: value === undefined ? null : Buffer.from(JSON.stringify(value)),
      headers: {},
      offset: '0',
      timestamp: '0',
      attributes: 0,
    },
  } as unknown as EachMessagePayload;
}

function inMemoryIdempotency(): IdempotencyStore {
  const seen = new Set<string>();
  return {
    hasProcessed: async (id) => seen.has(id),
    markProcessed: async (id) => {
      seen.add(id);
    },
  };
}

function setup() {
  const dlqProducer = { send: vi.fn().mockResolvedValue(undefined) } as unknown as Producer;
  const idempotency = inMemoryIdempotency();
  const consumer = new EventConsumer({} as Consumer, dlqProducer, idempotency);
  return { consumer, dlqProducer, idempotency };
}

describe('EventConsumer.processMessage', () => {
  it('procesa un evento válido exactamente una vez y lo marca como procesado', async () => {
    const { consumer, idempotency } = setup();
    const handle = vi.fn().mockResolvedValue(undefined);
    const handler: ConsumerHandler<ExampleCreatedEvent['payload']> = {
      topic: Topics.ExampleCreated,
      schema: ExampleCreatedEventSchema,
      handle,
    };

    await consumer.processMessage(handler, payloadFor(validEvent));
    expect(handle).toHaveBeenCalledTimes(1);
    expect(await idempotency.hasProcessed(validEvent.eventId)).toBe(true);

    // Una reentrega del mismo evento debe omitirse.
    await consumer.processMessage(handler, payloadFor(validEvent));
    expect(handle).toHaveBeenCalledTimes(1);
  });

  it('enruta un mensaje con schema inválido (envenenado) a la DLQ sin reintentar', async () => {
    const { consumer, dlqProducer } = setup();
    const handle = vi.fn();
    const handler: ConsumerHandler<ExampleCreatedEvent['payload']> = {
      topic: Topics.ExampleCreated,
      schema: ExampleCreatedEventSchema,
      handle,
    };

    await consumer.processMessage(handler, payloadFor({ not: 'an-event' }));

    expect(handle).not.toHaveBeenCalled();
    expect(dlqProducer.send).toHaveBeenCalledWith(
      expect.objectContaining({ topic: `${Topics.ExampleCreated}.dlq` }),
    );
  });

  it('reintenta un handler que falla y enruta a la DLQ al agotar los reintentos', async () => {
    const { consumer, dlqProducer } = setup();
    const handle = vi.fn().mockRejectedValue(new Error('boom'));
    const handler: ConsumerHandler<ExampleCreatedEvent['payload']> = {
      topic: Topics.ExampleCreated,
      schema: ExampleCreatedEventSchema,
      handle,
      maxRetries: 2,
    };

    await consumer.processMessage(handler, payloadFor(validEvent));

    expect(handle).toHaveBeenCalledTimes(2);
    expect(dlqProducer.send).toHaveBeenCalledWith(
      expect.objectContaining({ topic: `${Topics.ExampleCreated}.dlq` }),
    );
  });
});
