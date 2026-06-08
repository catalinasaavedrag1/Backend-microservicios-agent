import type { ConsumerHandler } from '@bjm/shared';
import { ExampleCreatedEventSchema, Topics, type ExampleCreatedPayload } from '@bjm/contracts';
import type { PublishExampleUseCase } from '../../application/use-cases/PublishExample.usecase';

/**
 * Demuestra el lado consumidor: reacciona a `ExampleCreated` y publica el
 * agregado de forma idempotente. En un proyecto real este handler reaccionaría
 * a eventos de **otros** servicios.
 */
export function exampleConsumerHandlers(
  publishExample: PublishExampleUseCase,
): ConsumerHandler<unknown>[] {
  const handler: ConsumerHandler<ExampleCreatedPayload> = {
    topic: Topics.ExampleCreated,
    schema: ExampleCreatedEventSchema,
    handle: async (event) => {
      await publishExample.execute(event.payload.exampleId);
    },
  };

  return [handler] as ConsumerHandler<unknown>[];
}
