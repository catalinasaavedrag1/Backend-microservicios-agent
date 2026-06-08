import { NotFoundError } from '@bjm/shared';
import type { ExampleRepository } from '../ports/ExampleRepository';

/** Elimina un example existente. */
export class DeleteExampleUseCase {
  constructor(private readonly examples: ExampleRepository) {}

  async execute(id: string): Promise<void> {
    const example = await this.examples.findById(id);
    if (!example) {
      throw new NotFoundError('Example');
    }
    await this.examples.delete(id);
  }
}
