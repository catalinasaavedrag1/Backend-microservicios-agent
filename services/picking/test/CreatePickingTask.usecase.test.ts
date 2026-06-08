import { describe, expect, it } from 'vitest';
import { Topics } from '@bjm/contracts';
import { CreatePickingTaskUseCase } from '../src/modules/picking/application/use-cases/CreatePickingTask.usecase';
import type {
  CreatePickingTaskCommand,
  OutboxEvent,
  PickingRepository,
  PickingTaskView,
} from '../src/modules/picking/application/ports/PickingRepository';

class InMemoryPickingRepository implements PickingRepository {
  readonly outbox: OutboxEvent[] = [];
  readonly tasks: CreatePickingTaskCommand[] = [];

  async hasTaskForOrder(orderId: string): Promise<boolean> {
    return this.tasks.some((t) => t.orderId === orderId);
  }

  async create(command: CreatePickingTaskCommand, outbox: OutboxEvent): Promise<void> {
    this.tasks.push(command);
    this.outbox.push(outbox);
  }

  async listTasks(): Promise<PickingTaskView[]> {
    return this.tasks.map((t) => ({ ...t, status: 'PENDING' }));
  }

  async findByOrderId(orderId: string): Promise<PickingTaskView | null> {
    const task = this.tasks.find((t) => t.orderId === orderId);
    return task ? { ...task, status: 'PENDING' } : null;
  }
}

const orderId = '22222222-2222-2222-2222-222222222222';
const reservationId = '33333333-3333-3333-3333-333333333333';

describe('CreatePickingTaskUseCase', () => {
  it('creates a task and emits PickingAssigned', async () => {
    const repo = new InMemoryPickingRepository();
    const useCase = new CreatePickingTaskUseCase(repo);

    await useCase.execute({
      orderId,
      reservationId,
      items: [{ sku: 'SKU-1', quantity: 2 }],
      correlationId: 'corr-1',
      causationId: 'evt-1',
    });

    expect(repo.tasks).toHaveLength(1);
    expect(repo.outbox).toHaveLength(1);
    expect(repo.outbox[0]?.topic).toBe(Topics.PickingAssigned);
    expect(repo.outbox[0]?.payload).toMatchObject({ orderId, reservationId });
  });

  it('is idempotent when a task already exists for the order', async () => {
    const repo = new InMemoryPickingRepository();
    const useCase = new CreatePickingTaskUseCase(repo);
    const input = {
      orderId,
      reservationId,
      items: [{ sku: 'SKU-1', quantity: 2 }],
      correlationId: 'corr-1',
      causationId: 'evt-1',
    };

    await useCase.execute(input);
    await useCase.execute(input);

    expect(repo.tasks).toHaveLength(1);
    expect(repo.outbox).toHaveLength(1);
  });
});
