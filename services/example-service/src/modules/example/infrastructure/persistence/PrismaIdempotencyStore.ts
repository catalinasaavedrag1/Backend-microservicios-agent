import type { IdempotencyStore } from '@bjm/shared';
import { prisma } from '../../../../config/database';

/** Store de idempotencia (tabla inbox) para los eventos consumidos. */
export class PrismaIdempotencyStore implements IdempotencyStore {
  async hasProcessed(eventId: string): Promise<boolean> {
    const row = await prisma.processedEvent.findUnique({ where: { eventId } });
    return row !== null;
  }

  async markProcessed(eventId: string, eventType: string): Promise<void> {
    await prisma.processedEvent.upsert({
      where: { eventId },
      create: { eventId, eventType },
      update: {},
    });
  }
}
