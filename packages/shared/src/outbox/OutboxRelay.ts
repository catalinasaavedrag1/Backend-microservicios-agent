import type { EventPublisher } from '../kafka/EventPublisher';
import { logger } from '../logger/logger';

export interface OutboxMessageRecord {
  id: string;
  eventId: string;
  topic: string;
  eventType: string;
  eventVersion: number;
  aggregateId: string;
  aggregateType: string;
  correlationId: string;
  causationId: string | null;
  payload: unknown;
}

/**
 * Port over the outbox table. The write side persists events transactionally
 * with the aggregate change; this relay reads and publishes them.
 */
export interface OutboxPort {
  fetchUnpublished(limit: number): Promise<OutboxMessageRecord[]>;
  markPublished(ids: string[]): Promise<void>;
}

export interface OutboxRelayOptions {
  intervalMs?: number;
  batchSize?: number;
}

/**
 * Transactional Outbox relay: polls unpublished rows and forwards them to Kafka,
 * reusing the stored `eventId` so a re-published row stays idempotent for
 * consumers (CLAUDE.md §4 "Outbox Pattern").
 */
export class OutboxRelay {
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly port: OutboxPort,
    private readonly publisher: EventPublisher,
    private readonly options: OutboxRelayOptions = {},
  ) {}

  start(): void {
    const interval = this.options.intervalMs ?? 1000;
    this.timer = setInterval(() => {
      void this.tick();
    }, interval);
    logger.info({ intervalMs: interval }, 'outbox relay started');
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  /** Publishes one batch. Returns the number of messages published. */
  async tick(): Promise<number> {
    if (this.running) return 0;
    this.running = true;
    try {
      const batch = await this.port.fetchUnpublished(this.options.batchSize ?? 50);
      if (batch.length === 0) return 0;

      const publishedIds: string[] = [];
      for (const message of batch) {
        await this.publisher.publish({
          topic: message.topic,
          eventType: message.eventType,
          eventVersion: message.eventVersion,
          aggregateId: message.aggregateId,
          aggregateType: message.aggregateType,
          payload: message.payload,
          correlationId: message.correlationId,
          ...(message.causationId ? { causationId: message.causationId } : {}),
          eventId: message.eventId,
        });
        publishedIds.push(message.id);
      }

      await this.port.markPublished(publishedIds);
      logger.info({ count: publishedIds.length }, 'outbox batch published');
      return publishedIds.length;
    } catch (err) {
      logger.error({ err }, 'outbox relay tick failed');
      return 0;
    } finally {
      this.running = false;
    }
  }
}
