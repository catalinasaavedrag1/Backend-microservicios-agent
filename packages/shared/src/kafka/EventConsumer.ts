import type { Consumer, EachMessagePayload, Producer } from 'kafkajs';
import type { z } from 'zod';
import { dlqTopic, type DomainEvent } from '@bjm/contracts';
import { logger } from '../logger/logger';
import type { IdempotencyStore } from './IdempotencyStore';

export interface ConsumerHandler<TPayload> {
  topic: string;
  schema: z.ZodType<DomainEvent<TPayload>>;
  handle: (event: DomainEvent<TPayload>, ctx: { raw: EachMessagePayload }) => Promise<void>;
  /** Max processing attempts before the message is routed to the DLQ. */
  maxRetries?: number;
}

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generic Kafka consumer implementing the patterns required by CLAUDE.md §4/§7:
 *  - schema validation (poison messages go straight to the DLQ),
 *  - idempotency via an injected {@link IdempotencyStore},
 *  - bounded retries with exponential backoff,
 *  - Dead Letter Queue routing when retries are exhausted.
 */
export class EventConsumer {
  constructor(
    private readonly consumer: Consumer,
    private readonly dlqProducer: Producer,
    private readonly idempotency: IdempotencyStore,
  ) {}

  async run(handlers: ConsumerHandler<unknown>[]): Promise<void> {
    const byTopic = new Map(handlers.map((h) => [h.topic, h]));

    for (const handler of handlers) {
      await this.consumer.subscribe({ topic: handler.topic, fromBeginning: false });
    }

    await this.consumer.run({
      eachMessage: async (payload) => {
        const handler = byTopic.get(payload.topic);
        if (!handler) {
          logger.warn({ topic: payload.topic }, 'no handler registered for topic');
          return;
        }
        await this.processMessage(handler, payload);
      },
    });
  }

  /** Exposed for unit testing the validate -> idempotency -> retry -> DLQ flow. */
  async processMessage<TPayload>(
    handler: ConsumerHandler<TPayload>,
    payload: EachMessagePayload,
  ): Promise<void> {
    const raw = payload.message.value?.toString();
    if (!raw) {
      logger.warn({ topic: payload.topic }, 'empty message skipped');
      return;
    }

    const parsed = handler.schema.safeParse(safeJsonParse(raw));
    if (!parsed.success) {
      logger.error(
        { topic: payload.topic, issues: parsed.success ? undefined : parsed.error.flatten() },
        'invalid event schema -> DLQ',
      );
      await this.routeToDlq(payload, 'SCHEMA_VALIDATION_FAILED');
      return;
    }

    const event = parsed.data;
    const log = logger.child({
      eventId: event.eventId,
      eventType: event.eventType,
      correlationId: event.correlationId,
      topic: payload.topic,
    });

    if (await this.idempotency.hasProcessed(event.eventId)) {
      log.info('duplicate event skipped');
      return;
    }

    const maxRetries = handler.maxRetries ?? 3;
    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
      try {
        await handler.handle(event, { raw: payload });
        await this.idempotency.markProcessed(event.eventId, event.eventType);
        log.info('event processed');
        return;
      } catch (err) {
        log.warn({ err, attempt, maxRetries }, 'handler failed');
        if (attempt === maxRetries) {
          log.error({ err }, 'retries exhausted -> DLQ');
          await this.routeToDlq(payload, 'HANDLER_FAILED', err);
          return;
        }
        await delay(2 ** attempt * 100);
      }
    }
  }

  private async routeToDlq(
    payload: EachMessagePayload,
    reason: string,
    err?: unknown,
  ): Promise<void> {
    await this.dlqProducer.send({
      topic: dlqTopic(payload.topic),
      messages: [
        {
          key: payload.message.key ?? null,
          value: payload.message.value ?? null,
          headers: {
            ...(payload.message.headers ?? {}),
            'dlq-reason': reason,
            'dlq-error': err instanceof Error ? err.message : String(err ?? ''),
            'dlq-origin-topic': payload.topic,
            'dlq-at': new Date().toISOString(),
          },
        },
      ],
    });
  }
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}
