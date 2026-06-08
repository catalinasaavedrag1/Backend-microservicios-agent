import { prisma } from '../../../../config/database';
import type { Example } from '../../domain/Example';
import type { ExampleStatus } from '../../domain/ExampleStatus';
import type {
  ExampleRepository,
  ListParams,
  OutboxEvent,
  Paginated,
} from '../../application/ports/ExampleRepository';
import { ExampleMapper } from './example.mapper';

export class PrismaExampleRepository implements ExampleRepository {
  async create(example: Example, outbox: OutboxEvent[]): Promise<void> {
    const snapshot = example.toJSON();
    await prisma.$transaction(async (tx) => {
      await tx.example.create({
        data: { id: snapshot.id, name: snapshot.name, status: snapshot.status },
      });
      if (outbox.length > 0) {
        await tx.outboxMessage.createMany({ data: outbox.map(ExampleMapper.toOutboxRow) });
      }
    });
  }

  async findById(id: string): Promise<Example | null> {
    const row = await prisma.example.findUnique({ where: { id } });
    return row ? ExampleMapper.toDomain(row) : null;
  }

  async list(params: ListParams): Promise<Paginated<Example>> {
    const [rows, total] = await prisma.$transaction([
      prisma.example.findMany({
        orderBy: { createdAt: 'desc' },
        take: params.limit,
        skip: params.offset,
      }),
      prisma.example.count(),
    ]);
    return { items: rows.map(ExampleMapper.toDomain), total };
  }

  async update(example: Example, outbox: OutboxEvent[] = []): Promise<void> {
    const snapshot = example.toJSON();
    await prisma.$transaction(async (tx) => {
      await tx.example.update({
        where: { id: snapshot.id },
        data: { name: snapshot.name, status: snapshot.status },
      });
      if (outbox.length > 0) {
        await tx.outboxMessage.createMany({ data: outbox.map(ExampleMapper.toOutboxRow) });
      }
    });
  }

  async updateStatus(id: string, status: ExampleStatus, outbox: OutboxEvent[] = []): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.example.update({ where: { id }, data: { status } });
      if (outbox.length > 0) {
        await tx.outboxMessage.createMany({ data: outbox.map(ExampleMapper.toOutboxRow) });
      }
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.example.delete({ where: { id } });
  }
}
