import { Order } from '../../domain/Order';
import type { OrderStatus } from '../../domain/OrderStatus';
import type { OutboxEvent } from '../../application/ports/OrderRepository';

interface OrderItemRow {
  sku: string;
  quantity: number;
  unitPrice: { toString(): string };
}

interface OrderRow {
  id: string;
  customerId: string;
  status: string;
  currency: string;
  totalAmount: { toString(): string };
  items: OrderItemRow[];
  createdAt: Date;
  updatedAt: Date;
}

export const OrderMapper = {
  toDomain(row: OrderRow): Order {
    return Order.rehydrate({
      id: row.id,
      customerId: row.customerId,
      status: row.status as OrderStatus,
      currency: row.currency,
      totalAmount: Number(row.totalAmount.toString()),
      items: row.items.map((item) => ({
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice.toString()),
      })),
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
