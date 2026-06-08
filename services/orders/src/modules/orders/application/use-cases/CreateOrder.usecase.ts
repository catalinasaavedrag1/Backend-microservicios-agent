import { newId } from '@bjm/shared';
import { OrderCreatedEventType, OrderCreatedVersion, Topics } from '@bjm/contracts';
import { Order, type OrderItem } from '../../domain/Order';
import type { OrderRepository, OutboxEvent } from '../ports/OrderRepository';

export interface CreateOrderInput {
  customerId: string;
  currency: string;
  items: OrderItem[];
  correlationId: string;
}

/**
 * Creates an order and emits `OrderCreated` through the outbox. No infrastructure
 * detail leaks in here: the use case orchestrates the domain and the repository
 * port only.
 */
export class CreateOrderUseCase {
  constructor(private readonly orders: OrderRepository) {}

  async execute(input: CreateOrderInput): Promise<Order> {
    const order = Order.create({
      id: newId(),
      customerId: input.customerId,
      currency: input.currency,
      items: input.items,
    });

    const event: OutboxEvent = {
      eventId: newId(),
      topic: Topics.OrderCreated,
      eventType: OrderCreatedEventType,
      eventVersion: OrderCreatedVersion,
      aggregateId: order.id,
      aggregateType: 'Order',
      correlationId: input.correlationId,
      payload: {
        orderId: order.id,
        customerId: order.customerId,
        currency: order.currency,
        totalAmount: order.totalAmount,
        items: order.items.map((item) => ({ ...item })),
      },
    };

    await this.orders.create(order, [event]);
    return order;
  }
}
