import { logger, newId } from '@bjm/shared';
import {
  ReservationFailedEventType,
  ReservationFailedVersion,
  StockReservedEventType,
  StockReservedVersion,
  Topics,
} from '@bjm/contracts';
import type {
  InventoryRepository,
  OutboxEvent,
  ReserveLine,
  ReserveResult,
} from '../ports/InventoryRepository';

export interface ReserveStockInput {
  orderId: string;
  items: ReserveLine[];
  correlationId: string;
  causationId: string;
}

/**
 * Tries to reserve stock for an order and emits the corresponding saga event
 * (`StockReserved` or `ReservationFailed`) through the outbox.
 */
export class ReserveStockUseCase {
  constructor(private readonly inventory: InventoryRepository) {}

  async execute(input: ReserveStockInput): Promise<void> {
    if (await this.inventory.hasReservation(input.orderId)) {
      logger.info({ orderId: input.orderId }, 'reservation already exists, skipping');
      return;
    }

    const reservationId = newId();
    const result = await this.inventory.reserve(
      { orderId: input.orderId, reservationId, items: input.items },
      (outcome) => this.toOutbox(outcome, input),
    );

    logger.info({ orderId: input.orderId, status: result.status }, 'stock reservation evaluated');
  }

  private toOutbox(result: ReserveResult, input: ReserveStockInput): OutboxEvent {
    const base = {
      eventId: newId(),
      aggregateId: input.orderId,
      aggregateType: 'Reservation',
      correlationId: input.correlationId,
      causationId: input.causationId,
    };

    if (result.status === 'reserved') {
      return {
        ...base,
        topic: Topics.StockReserved,
        eventType: StockReservedEventType,
        eventVersion: StockReservedVersion,
        payload: {
          orderId: input.orderId,
          reservationId: result.reservationId,
          items: result.items,
        },
      };
    }

    return {
      ...base,
      topic: Topics.ReservationFailed,
      eventType: ReservationFailedEventType,
      eventVersion: ReservationFailedVersion,
      payload: {
        orderId: input.orderId,
        reason: result.reason,
        shortages: result.shortages,
      },
    };
  }
}
