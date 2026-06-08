import { prisma } from '../../../../config/database';
import type { Order } from '../../domain/Order';
import type { OrderStatus } from '../../domain/OrderStatus';
import type { OrderRepository, OutboxEvent } from '../../application/ports/OrderRepository';
import { OrderMapper } from './order.mapper';

export class PrismaOrderRepository implements OrderRepository {
  async create(order: Order, outbox: OutboxEvent[]): Promise<void> {
    const snapshot = order.toJSON();
    await prisma.$transaction(async (tx) => {
      await tx.order.create({
        data: {
          id: snapshot.id,
          customerId: snapshot.customerId,
          status: snapshot.status,
          currency: snapshot.currency,
          totalAmount: snapshot.totalAmount,
          items: {
            create: snapshot.items.map((item) => ({
              sku: item.sku,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        },
      });
      if (outbox.length > 0) {
        await tx.outboxMessage.createMany({ data: outbox.map(OrderMapper.toOutboxRow) });
      }
    });
  }

  async findById(id: string): Promise<Order | null> {
    const row = await prisma.order.findUnique({ where: { id }, include: { items: true } });
    return row ? OrderMapper.toDomain(row) : null;
  }

  async updateStatus(id: string, status: OrderStatus, outbox: OutboxEvent[] = []): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id }, data: { status } });
      if (outbox.length > 0) {
        await tx.outboxMessage.createMany({ data: outbox.map(OrderMapper.toOutboxRow) });
      }
    });
  }
}
