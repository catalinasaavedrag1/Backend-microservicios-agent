import type { Shortage } from '@bjm/contracts';

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

export interface ReserveLine {
  sku: string;
  quantity: number;
}

export interface ReserveCommand {
  orderId: string;
  reservationId: string;
  items: ReserveLine[];
}

export type ReserveResult =
  | { status: 'reserved'; reservationId: string; items: ReserveLine[] }
  | { status: 'failed'; reason: string; shortages: Shortage[] };

export interface StockItemView {
  sku: string;
  available: number;
  reserved: number;
}

export interface InventoryRepository {
  hasReservation(orderId: string): Promise<boolean>;
  /**
   * Atomically evaluates availability and either reserves stock or records a
   * failure, persisting the outbox event produced by `toOutbox` in the same
   * transaction (keeps the saga and the outbox consistent).
   */
  reserve(
    command: ReserveCommand,
    toOutbox: (result: ReserveResult) => OutboxEvent,
  ): Promise<ReserveResult>;
  listStock(): Promise<StockItemView[]>;
  upsertStock(sku: string, available: number): Promise<StockItemView>;
}
