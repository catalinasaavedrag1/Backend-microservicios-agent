import { z } from 'zod';

/**
 * Standard event envelope shared by every domain event flowing through Kafka.
 * Keeping a single, versioned envelope is what makes correlation, idempotency
 * and replay possible across services (see CLAUDE.md section 7).
 */
export interface DomainEvent<TPayload> {
  eventId: string;
  eventType: string;
  eventVersion: number;
  aggregateId: string;
  aggregateType: string;
  occurredAt: string;
  correlationId: string;
  causationId?: string;
  source: string;
  payload: TPayload;
}

export const envelopeBaseSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.string().min(1),
  eventVersion: z.number().int().positive(),
  aggregateId: z.string().min(1),
  aggregateType: z.string().min(1),
  occurredAt: z.string().datetime(),
  correlationId: z.string().min(1),
  causationId: z.string().min(1).optional(),
  source: z.string().min(1),
});

/**
 * Builds a fully-typed Zod schema for a concrete event by attaching its payload
 * schema to the shared envelope.
 */
export function domainEventSchema<TPayload extends z.ZodTypeAny>(payload: TPayload) {
  return envelopeBaseSchema.extend({ payload });
}
