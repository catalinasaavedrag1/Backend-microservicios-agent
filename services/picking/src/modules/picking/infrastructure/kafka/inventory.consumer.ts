import type { ConsumerHandler } from '@bjm/shared';
import { StockReservedEventSchema, Topics, type StockReservedPayload } from '@bjm/contracts';
import type { CreatePickingTaskUseCase } from '../../application/use-cases/CreatePickingTask.usecase';

/** Reacts to `StockReserved` by creating a picking task. */
export function inventoryConsumerHandlers(
  createPickingTask: CreatePickingTaskUseCase,
): ConsumerHandler<unknown>[] {
  const handler: ConsumerHandler<StockReservedPayload> = {
    topic: Topics.StockReserved,
    schema: StockReservedEventSchema,
    handle: async (event) => {
      await createPickingTask.execute({
        orderId: event.payload.orderId,
        reservationId: event.payload.reservationId,
        items: event.payload.items.map((item) => ({ sku: item.sku, quantity: item.quantity })),
        correlationId: event.correlationId,
        causationId: event.eventId,
      });
    },
  };

  return [handler] as ConsumerHandler<unknown>[];
}
