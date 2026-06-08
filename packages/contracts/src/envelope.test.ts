import { describe, expect, it } from 'vitest';
import { OrderCreatedEventSchema } from './events/orderCreated';

describe('OrderCreatedEventSchema', () => {
  const validEvent = {
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

  it('accepts a well-formed event', () => {
    expect(OrderCreatedEventSchema.parse(validEvent)).toMatchObject({
      eventType: 'oms.order.created',
    });
  });

  it('rejects an event with an empty item list', () => {
    const invalid = { ...validEvent, payload: { ...validEvent.payload, items: [] } };
    expect(OrderCreatedEventSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects an event missing the correlation id', () => {
    const { correlationId: _omit, ...rest } = validEvent;
    expect(OrderCreatedEventSchema.safeParse(rest).success).toBe(false);
  });
});
