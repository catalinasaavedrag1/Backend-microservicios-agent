import type { OutboxMessageRecord, OutboxPort } from '@bjm/shared';
import { prisma } from '../../../../config/database';

export class PrismaOutboxRepository implements OutboxPort {
  async fetchUnpublished(limit: number): Promise<OutboxMessageRecord[]> {
    const rows = await prisma.outboxMessage.findMany({
      where: { publishedAt: null },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
    return rows.map((row) => ({
      id: row.id,
      eventId: row.eventId,
      topic: row.topic,
      eventType: row.eventType,
      eventVersion: row.eventVersion,
      aggregateId: row.aggregateId,
      aggregateType: row.aggregateType,
      correlationId: row.correlationId,
      causationId: row.causationId,
      payload: row.payload,
    }));
  }

  async markPublished(ids: string[]): Promise<void> {
    await prisma.outboxMessage.updateMany({
      where: { id: { in: ids } },
      data: { publishedAt: new Date() },
    });
  }
}
