import { describe, expect, it } from 'vitest';
import { Topics } from '@bjm/contracts';
import { CreateOrderUseCase } from '../src/modules/orders/application/use-cases/CreateOrder.usecase';
import type {
  OrderRepository,
  OutboxEvent,
} from '../src/modules/orders/application/ports/OrderRepository';
import type { Order } from '../src/modules/orders/domain/Order';
import type { OrderStatus } from '../src/modules/orders/domain/OrderStatus';

class InMemoryOrderRepository implements OrderRepository {
  readonly saved: { order: Order; outbox: OutboxEvent[] }[] = [];

  async create(order: Order, outbox: OutboxEvent[]): Promise<void> {
    this.saved.push({ order, outbox });
  }

  async findById(id: string): Promise<Order | null> {
    return this.saved.find((s) => s.order.id === id)?.order ?? null;
  }

  async updateStatus(_id: string, _status: OrderStatus): Promise<void> {
    // not exercised here
  }
}

describe('CreateOrderUseCase', () => {
  it('persists the order with an OrderCreated outbox event carrying the correlation id', async () => {
    const repo = new InMemoryOrderRepository();
    const useCase = new CreateOrderUseCase(repo);

    const order = await useCase.execute({
      customerId: 'cust-1',
      currency: 'CLP',
      items: [{ sku: 'SKU-1', quantity: 3, unitPrice: 100 }],
      correlationId: 'corr-42',
    });

    expect(order.totalAmount).toBe(300);
    expect(repo.saved).toHaveLength(1);

    const [persisted] = repo.saved;
    expect(persisted?.outbox).toHaveLength(1);
    const event = persisted?.outbox[0];
    expect(event?.topic).toBe(Topics.OrderCreated);
    expect(event?.correlationId).toBe('corr-42');
    expect(event?.aggregateId).toBe(order.id);
    expect(event?.payload).toMatchObject({ orderId: order.id, totalAmount: 300 });
  });
});
