import { NotFoundError } from '@bjm/shared';
import type { Example } from '../../domain/Example';
import type { ExampleRepository } from '../ports/ExampleRepository';

export interface RenameExampleInput {
  id: string;
  name: string;
}

/** Renombra un example existente. Comando: carga el agregado, aplica la regla de
 *  dominio y persiste. */
export class RenameExampleUseCase {
  constructor(private readonly examples: ExampleRepository) {}

  async execute(input: RenameExampleInput): Promise<Example> {
    const example = await this.examples.findById(input.id);
    if (!example) {
      throw new NotFoundError('Example');
    }
    example.rename(input.name);
    await this.examples.update(example);
    return example;
  }
}
