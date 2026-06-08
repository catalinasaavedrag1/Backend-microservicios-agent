import { newId } from '@bjm/shared';
import { ExampleCreatedEventType, ExampleCreatedVersion, Topics } from '@bjm/contracts';
import { Example } from '../../domain/Example';
import type { ExampleRepository, OutboxEvent } from '../ports/ExampleRepository';

export interface CreateExampleInput {
  name: string;
  correlationId: string;
}

/**
 * Crea un `Example` y emite `ExampleCreated` a través del outbox. No se filtra
 * ningún detalle de infraestructura: el use case orquesta el dominio y el port
 * de repositorio, nada más.
 */
export class CreateExampleUseCase {
  constructor(private readonly examples: ExampleRepository) {}

  async execute(input: CreateExampleInput): Promise<Example> {
    const example = Example.create({ id: newId(), name: input.name });

    const event: OutboxEvent = {
      eventId: newId(),
      topic: Topics.ExampleCreated,
      eventType: ExampleCreatedEventType,
      eventVersion: ExampleCreatedVersion,
      aggregateId: example.id,
      aggregateType: 'Example',
      correlationId: input.correlationId,
      payload: { exampleId: example.id, name: example.name },
    };

    await this.examples.create(example, [event]);
    return example;
  }
}
