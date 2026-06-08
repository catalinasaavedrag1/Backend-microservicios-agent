import { describe, expect, it } from 'vitest';
import { Topics } from '@bjm/contracts';
import { CreateExampleUseCase } from '../src/modules/example/application/use-cases/CreateExample.usecase';
import type {
  ExampleRepository,
  OutboxEvent,
} from '../src/modules/example/application/ports/ExampleRepository';
import type { Example } from '../src/modules/example/domain/Example';
import type { ExampleStatus } from '../src/modules/example/domain/ExampleStatus';

class InMemoryExampleRepository implements ExampleRepository {
  readonly saved: { example: Example; outbox: OutboxEvent[] }[] = [];

  async create(example: Example, outbox: OutboxEvent[]): Promise<void> {
    this.saved.push({ example, outbox });
  }

  async findById(id: string): Promise<Example | null> {
    return this.saved.find((s) => s.example.id === id)?.example ?? null;
  }

  async updateStatus(_id: string, _status: ExampleStatus): Promise<void> {
    // no se ejercita aquí
  }
}

describe('CreateExampleUseCase', () => {
  it('persiste el example con un evento ExampleCreated que lleva el correlationId', async () => {
    const repo = new InMemoryExampleRepository();
    const useCase = new CreateExampleUseCase(repo);

    const example = await useCase.execute({ name: 'demo', correlationId: 'corr-42' });

    expect(repo.saved).toHaveLength(1);
    const [persisted] = repo.saved;
    expect(persisted?.outbox).toHaveLength(1);
    const event = persisted?.outbox[0];
    expect(event?.topic).toBe(Topics.ExampleCreated);
    expect(event?.correlationId).toBe('corr-42');
    expect(event?.aggregateId).toBe(example.id);
    expect(event?.payload).toMatchObject({ exampleId: example.id, name: 'demo' });
  });
});
