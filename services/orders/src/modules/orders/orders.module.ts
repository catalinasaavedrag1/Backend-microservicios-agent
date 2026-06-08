import type { ConsumerHandler, IdempotencyStore, OutboxPort, RoutePlugin } from '@bjm/shared';
import { CreateOrderUseCase } from './application/use-cases/CreateOrder.usecase';
import { ConfirmOrderUseCase } from './application/use-cases/ConfirmOrder.usecase';
import { RejectOrderUseCase } from './application/use-cases/RejectOrder.usecase';
import { PrismaOrderRepository } from './infrastructure/persistence/PrismaOrderRepository';
import { PrismaOutboxRepository } from './infrastructure/persistence/PrismaOutboxRepository';
import { PrismaIdempotencyStore } from './infrastructure/persistence/PrismaIdempotencyStore';
import { OrdersController } from './infrastructure/http/orders.controller';
import { ordersRoutes } from './infrastructure/http/orders.routes';
import { inventoryConsumerHandlers } from './infrastructure/kafka/inventory.consumer';

export interface OrdersModule {
  routes: RoutePlugin[];
  consumerHandlers: ConsumerHandler<unknown>[];
  outboxPort: OutboxPort;
  idempotency: IdempotencyStore;
}

/** Composition root for the orders module (wires the dependency graph). */
export function buildOrdersModule(): OrdersModule {
  const orderRepository = new PrismaOrderRepository();
  const outboxPort = new PrismaOutboxRepository();
  const idempotency = new PrismaIdempotencyStore();

  const createOrder = new CreateOrderUseCase(orderRepository);
  const confirmOrder = new ConfirmOrderUseCase(orderRepository);
  const rejectOrder = new RejectOrderUseCase(orderRepository);

  const controller = new OrdersController(createOrder, orderRepository);

  return {
    routes: [ordersRoutes(controller)],
    consumerHandlers: inventoryConsumerHandlers(confirmOrder, rejectOrder),
    outboxPort,
    idempotency,
  };
}
