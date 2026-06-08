import { describe, expect, it } from 'vitest';
import { Topics } from '@bjm/contracts';
import { CreateExampleUseCase } from '../src/modules/example/application/use-cases/CreateExample.usecase';
import { InMemoryExampleRepository } from './helpers/InMemoryExampleRepository';

describe('CreateExampleUseCase', () => {
  it('persiste el example con un evento ExampleCreated que lleva el correlationId', async () => {
    const repo = new InMemoryExampleRepository();
    const useCase = new CreateExampleUseCase(repo);

    const example = await useCase.execute({ name: 'demo', correlationId: 'corr-42' });

    expect(repo.items).toHaveLength(1);
    expect(repo.outbox).toHaveLength(1);
    const event = repo.outbox[0];
    expect(event?.topic).toBe(Topics.ExampleCreated);
    expect(event?.correlationId).toBe('corr-42');
    expect(event?.aggregateId).toBe(example.id);
    expect(event?.payload).toMatchObject({ exampleId: example.id, name: 'demo' });
  });
});
