import { NotFoundError } from '@bjm/shared';
import { OrderStatus } from '../../domain/OrderStatus';
import type { OrderRepository } from '../ports/OrderRepository';

/** Confirms an order once inventory has reserved its stock (saga step). */
export class ConfirmOrderUseCase {
  constructor(private readonly orders: OrderRepository) {}

  async execute(orderId: string): Promise<void> {
    const order = await this.orders.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order');
    }
    if (order.status === OrderStatus.Confirmed) {
      return; // already in the target state -> idempotent no-op
    }
    order.confirm();
    await this.orders.updateStatus(order.id, order.status);
  }
}
