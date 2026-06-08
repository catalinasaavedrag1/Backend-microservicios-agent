import { z } from 'zod';
import { domainEventSchema, type DomainEvent } from '../envelope';

/**
 * Evento de ejemplo (plantilla). Sirve como referencia de cómo definir un
 * contrato de evento: un tipo, una versión, un schema de payload Zod y el schema
 * del evento completo derivado del envelope estándar.
 */
export const ExampleCreatedEventType = 'example.created';
export const ExampleCreatedVersion = 1;

export const ExampleCreatedPayloadSchema = z.object({
  exampleId: z.string().uuid(),
  name: z.string().min(1),
});

export type ExampleCreatedPayload = z.infer<typeof ExampleCreatedPayloadSchema>;

export const ExampleCreatedEventSchema = domainEventSchema(ExampleCreatedPayloadSchema);
export type ExampleCreatedEvent = DomainEvent<ExampleCreatedPayload>;
