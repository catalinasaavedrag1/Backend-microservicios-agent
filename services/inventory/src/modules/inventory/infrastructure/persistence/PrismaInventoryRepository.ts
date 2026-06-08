import type { Shortage } from '@bjm/contracts';
import { prisma } from '../../../../config/database';
import type {
  InventoryRepository,
  OutboxEvent,
  ReserveCommand,
  ReserveResult,
  StockItemView,
} from '../../application/ports/InventoryRepository';
import { toOutboxRow } from './outbox.mapper';

export class PrismaInventoryRepository implements InventoryRepository {
  async hasReservation(orderId: string): Promise<boolean> {
    const row = await prisma.reservation.findUnique({ where: { orderId } });
    return row !== null;
  }

  async reserve(
    command: ReserveCommand,
    toOutbox: (result: ReserveResult) => OutboxEvent,
  ): Promise<ReserveResult> {
    return prisma.$transaction(async (tx) => {
      const skus = command.items.map((item) => item.sku);
      const stocks = await tx.stockItem.findMany({ where: { sku: { in: skus } } });
      const availableBySku = new Map(stocks.map((s) => [s.sku, s.available]));

      const shortages: Shortage[] = [];
      for (const item of command.items) {
        const available = availableBySku.get(item.sku) ?? 0;
        if (available < item.quantity) {
          shortages.push({ sku: item.sku, requested: item.quantity, available });
        }
      }

      const result: ReserveResult =
        shortages.length > 0
          ? { status: 'failed', reason: 'INSUFFICIENT_STOCK', shortages }
          : { status: 'reserved', reservationId: command.reservationId, items: command.items };

      if (result.status === 'reserved') {
        for (const item of command.items) {
          await tx.stockItem.update({
            where: { sku: item.sku },
            data: {
              available: { decrement: item.quantity },
              reserved: { increment: item.quantity },
            },
          });
        }
        await tx.reservation.create({
          data: {
            id: command.reservationId,
            orderId: command.orderId,
            status: 'RESERVED',
            items: { create: command.items.map((i) => ({ sku: i.sku, quantity: i.quantity })) },
          },
        });
      }

      await tx.outboxMessage.create({ data: toOutboxRow(toOutbox(result)) });
      return result;
    });
  }

  async listStock(): Promise<StockItemView[]> {
    const rows = await prisma.stockItem.findMany({ orderBy: { sku: 'asc' } });
    return rows.map((r) => ({ sku: r.sku, available: r.available, reserved: r.reserved }));
  }

  async upsertStock(sku: string, available: number): Promise<StockItemView> {
    const row = await prisma.stockItem.upsert({
      where: { sku },
      create: { sku, available },
      update: { available },
    });
    return { sku: row.sku, available: row.available, reserved: row.reserved };
  }
}
