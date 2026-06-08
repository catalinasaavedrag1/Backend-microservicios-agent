import type { ConsumerHandler } from '@bjm/shared';
import {
  ReservationFailedEventSchema,
  StockReservedEventSchema,
  Topics,
  type ReservationFailedPayload,
  type StockReservedPayload,
} from '@bjm/contracts';
import type { ConfirmOrderUseCase } from '../../application/use-cases/ConfirmOrder.usecase';
import type { RejectOrderUseCase } from '../../application/use-cases/RejectOrder.usecase';

/**
 * Saga reactions owned by the orders service:
 *  - stock reserved   -> confirm order
 *  - reservation failed -> reject order (compensation)
 */
export function inventoryConsumerHandlers(
  confirmOrder: ConfirmOrderUseCase,
  rejectOrder: RejectOrderUseCase,
): ConsumerHandler<unknown>[] {
  const reserved: ConsumerHandler<StockReservedPayload> = {
    topic: Topics.StockReserved,
    schema: StockReservedEventSchema,
    handle: async (event) => {
      await confirmOrder.execute(event.payload.orderId);
    },
  };

  const failed: ConsumerHandler<ReservationFailedPayload> = {
    topic: Topics.ReservationFailed,
    schema: ReservationFailedEventSchema,
    handle: async (event) => {
      await rejectOrder.execute(event.payload.orderId);
    },
  };

  return [reserved, failed] as ConsumerHandler<unknown>[];
}
