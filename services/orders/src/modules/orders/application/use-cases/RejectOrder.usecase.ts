import { NotFoundError } from '@bjm/shared';
import { OrderStatus } from '../../domain/OrderStatus';
import type { OrderRepository } from '../ports/OrderRepository';

/** Rejects an order when inventory cannot reserve its stock (saga compensation). */
export class RejectOrderUseCase {
  constructor(private readonly orders: OrderRepository) {}

  async execute(orderId: string): Promise<void> {
    const order = await this.orders.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order');
    }
    if (order.status === OrderStatus.Rejected) {
      return; // idempotent no-op
    }
    order.reject();
    await this.orders.updateStatus(order.id, order.status);
  }
}
