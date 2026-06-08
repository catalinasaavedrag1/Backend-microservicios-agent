/**
 * Inbox / idempotency port. Implementations persist processed event ids so a
 * redelivered message (at-least-once delivery) is not handled twice.
 */
export interface IdempotencyStore {
  hasProcessed(eventId: string): Promise<boolean>;
  markProcessed(eventId: string, eventType: string): Promise<void>;
}
