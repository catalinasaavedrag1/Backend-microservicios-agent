import { describe, expect, it, vi } from 'vitest';
import type { Consumer, EachMessagePayload, Producer } from 'kafkajs';
import { OrderCreatedEventSchema, Topics, type OrderCreatedEvent } from '@bjm/contracts';
import { EventConsumer, type ConsumerHandler } from './EventConsumer';
import type { IdempotencyStore } from './IdempotencyStore';

const validEvent: OrderCreatedEvent = {
  eventId: '11111111-1111-1111-1111-111111111111',
  eventType: 'oms.order.created',
  eventVersion: 1,
  aggregateId: '22222222-2222-2222-2222-222222222222',
  aggregateType: 'Order',
  occurredAt: '2026-06-08T00:00:00.000Z',
  correlationId: 'corr-1',
  source: 'orders-service',
  payload: {
    orderId: '22222222-2222-2222-2222-222222222222',
    customerId: 'cust-1',
    currency: 'CLP',
    totalAmount: 100,
    items: [{ sku: 'SKU-1', quantity: 2, unitPrice: 50 }],
  },
};

function payloadFor(value: unknown): EachMessagePayload {
  return {
    topic: Topics.OrderCreated,
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
  it('handles a valid event exactly once and marks it processed', async () => {
    const { consumer, idempotency } = setup();
    const handle = vi.fn().mockResolvedValue(undefined);
    const handler: ConsumerHandler<OrderCreatedEvent['payload']> = {
      topic: Topics.OrderCreated,
      schema: OrderCreatedEventSchema,
      handle,
    };

    await consumer.processMessage(handler, payloadFor(validEvent));
    expect(handle).toHaveBeenCalledTimes(1);
    expect(await idempotency.hasProcessed(validEvent.eventId)).toBe(true);

    // Redelivery of the same event must be skipped.
    await consumer.processMessage(handler, payloadFor(validEvent));
    expect(handle).toHaveBeenCalledTimes(1);
  });

  it('routes a schema-invalid (poison) message to the DLQ without retrying', async () => {
    const { consumer, dlqProducer } = setup();
    const handle = vi.fn();
    const handler: ConsumerHandler<OrderCreatedEvent['payload']> = {
      topic: Topics.OrderCreated,
      schema: OrderCreatedEventSchema,
      handle,
    };

    await consumer.processMessage(handler, payloadFor({ not: 'an-event' }));

    expect(handle).not.toHaveBeenCalled();
    expect(dlqProducer.send).toHaveBeenCalledWith(
      expect.objectContaining({ topic: `${Topics.OrderCreated}.dlq` }),
    );
  });

  it('retries a failing handler and routes to the DLQ once retries are exhausted', async () => {
    const { consumer, dlqProducer } = setup();
    const handle = vi.fn().mockRejectedValue(new Error('boom'));
    const handler: ConsumerHandler<OrderCreatedEvent['payload']> = {
      topic: Topics.OrderCreated,
      schema: OrderCreatedEventSchema,
      handle,
      maxRetries: 2,
    };

    await consumer.processMessage(handler, payloadFor(validEvent));

    expect(handle).toHaveBeenCalledTimes(2);
    expect(dlqProducer.send).toHaveBeenCalledWith(
      expect.objectContaining({ topic: `${Topics.OrderCreated}.dlq` }),
    );
  });
});
