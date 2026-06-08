import { Prisma, prisma } from '../../../../config/database';
import type {
  CreatePickingTaskCommand,
  OutboxEvent,
  PickingLine,
  PickingRepository,
  PickingTaskView,
} from '../../application/ports/PickingRepository';

function toView(row: {
  id: string;
  orderId: string;
  reservationId: string;
  status: string;
  items: unknown;
}): PickingTaskView {
  return {
    id: row.id,
    orderId: row.orderId,
    reservationId: row.reservationId,
    status: row.status,
    items: row.items as PickingLine[],
  };
}

function toOutboxRow(event: OutboxEvent) {
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
}

export class PrismaPickingRepository implements PickingRepository {
  async hasTaskForOrder(orderId: string): Promise<boolean> {
    const row = await prisma.pickingTask.findUnique({ where: { orderId } });
    return row !== null;
  }

  async create(command: CreatePickingTaskCommand, outbox: OutboxEvent): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.pickingTask.create({
        data: {
          id: command.id,
          orderId: command.orderId,
          reservationId: command.reservationId,
          status: 'PENDING',
          items: command.items as unknown as Prisma.InputJsonValue,
        },
      });
      await tx.outboxMessage.create({ data: toOutboxRow(outbox) });
    });
  }

  async listTasks(): Promise<PickingTaskView[]> {
    const rows = await prisma.pickingTask.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map(toView);
  }

  async findByOrderId(orderId: string): Promise<PickingTaskView | null> {
    const row = await prisma.pickingTask.findUnique({ where: { orderId } });
    return row ? toView(row) : null;
  }
}
