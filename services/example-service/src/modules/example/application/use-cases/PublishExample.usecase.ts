import { NotFoundError } from '@bjm/shared';
import type { ExampleRepository } from '../ports/ExampleRepository';

/**
 * Publica un `Example`. Demuestra el lado consumidor: reacciona a un evento y
 * actualiza el agregado de forma idempotente.
 */
export class PublishExampleUseCase {
  constructor(private readonly examples: ExampleRepository) {}

  async execute(exampleId: string): Promise<void> {
    const example = await this.examples.findById(exampleId);
    if (!example) {
      throw new NotFoundError('Example');
    }
    example.publish();
    await this.examples.updateStatus(example.id, example.status);
  }
}
