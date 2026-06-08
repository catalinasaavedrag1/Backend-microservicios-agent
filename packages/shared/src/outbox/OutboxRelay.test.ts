import { describe, expect, it, vi } from 'vitest';
import { OutboxRelay, type OutboxMessageRecord, type OutboxPort } from './OutboxRelay';
import type { EventPublisher } from '../kafka/EventPublisher';

function record(id: string): OutboxMessageRecord {
  return {
    id,
    eventId: `evt-${id}`,
    topic: 'oms.orders.order-created.v1',
    eventType: 'oms.order.created',
    eventVersion: 1,
    aggregateId: `agg-${id}`,
    aggregateType: 'Order',
    correlationId: 'corr-1',
    causationId: null,
    payload: { orderId: id },
  };
}

describe('OutboxRelay', () => {
  it('publishes unpublished messages and marks them published with the stored eventId', async () => {
    const port: OutboxPort = {
      fetchUnpublished: vi.fn().mockResolvedValueOnce([record('1'), record('2')]),
      markPublished: vi.fn().mockResolvedValue(undefined),
    };
    const publisher = { publish: vi.fn().mockResolvedValue({}) } as unknown as EventPublisher;

    const relay = new OutboxRelay(port, publisher);
    const published = await relay.tick();

    expect(published).toBe(2);
    expect(publisher.publish).toHaveBeenCalledTimes(2);
    expect(publisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({ eventId: 'evt-1', topic: 'oms.orders.order-created.v1' }),
    );
    expect(port.markPublished).toHaveBeenCalledWith(['1', '2']);
  });

  it('does nothing when there is no backlog', async () => {
    const port: OutboxPort = {
      fetchUnpublished: vi.fn().mockResolvedValue([]),
      markPublished: vi.fn(),
    };
    const publisher = { publish: vi.fn() } as unknown as EventPublisher;

    const relay = new OutboxRelay(port, publisher);
    expect(await relay.tick()).toBe(0);
    expect(publisher.publish).not.toHaveBeenCalled();
    expect(port.markPublished).not.toHaveBeenCalled();
  });
});
