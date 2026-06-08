import { describe, expect, it } from 'vitest';
import { NotFoundError } from '@bjm/shared';
import { CreateExampleUseCase } from '../src/modules/example/application/use-cases/CreateExample.usecase';
import { RenameExampleUseCase } from '../src/modules/example/application/use-cases/RenameExample.usecase';
import { InMemoryExampleRepository } from './helpers/InMemoryExampleRepository';

describe('RenameExampleUseCase', () => {
  it('renombra un example existente', async () => {
    const repo = new InMemoryExampleRepository();
    const created = await new CreateExampleUseCase(repo).execute({
      name: 'antes',
      correlationId: 'c1',
    });

    const renamed = await new RenameExampleUseCase(repo).execute({
      id: created.id,
      name: 'después',
    });

    expect(renamed.name).toBe('después');
    expect((await repo.findById(created.id))?.name).toBe('después');
  });

  it('lanza NotFoundError si el example no existe', async () => {
    const repo = new InMemoryExampleRepository();
    const useCase = new RenameExampleUseCase(repo);

    await expect(useCase.execute({ id: 'inexistente', name: 'x' })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
