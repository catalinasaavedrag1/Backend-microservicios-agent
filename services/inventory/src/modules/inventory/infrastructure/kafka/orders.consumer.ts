import type { ConsumerHandler } from '@bjm/shared';
import { OrderCreatedEventSchema, Topics, type OrderCreatedPayload } from '@bjm/contracts';
import type { ReserveStockUseCase } from '../../application/use-cases/ReserveStock.usecase';

/** Reacts to `OrderCreated` by attempting a stock reservation. */
export function ordersConsumerHandlers(
  reserveStock: ReserveStockUseCase,
): ConsumerHandler<unknown>[] {
  const handler: ConsumerHandler<OrderCreatedPayload> = {
    topic: Topics.OrderCreated,
    schema: OrderCreatedEventSchema,
    handle: async (event) => {
      await reserveStock.execute({
        orderId: event.payload.orderId,
        items: event.payload.items.map((item) => ({ sku: item.sku, quantity: item.quantity })),
        correlationId: event.correlationId,
        causationId: event.eventId,
      });
    },
  };

  return [handler] as ConsumerHandler<unknown>[];
}
