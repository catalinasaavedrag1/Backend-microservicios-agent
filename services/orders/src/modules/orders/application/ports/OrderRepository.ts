import type { Order } from '../../domain/Order';
import type { OrderStatus } from '../../domain/OrderStatus';

/** A domain event ready to be persisted in the outbox within the same transaction. */
export interface OutboxEvent {
  eventId: string;
  topic: string;
  eventType: string;
  eventVersion: number;
  aggregateId: string;
  aggregateType: string;
  correlationId: string;
  causationId?: string;
  payload: unknown;
}

export interface OrderRepository {
  /** Persists a new order together with its outbox events atomically. */
  create(order: Order, outbox: OutboxEvent[]): Promise<void>;
  findById(id: string): Promise<Order | null>;
  /** Updates the order status (optionally emitting outbox events) atomically. */
  updateStatus(id: string, status: OrderStatus, outbox?: OutboxEvent[]): Promise<void>;
}
