import type { ConsumerHandler, IdempotencyStore, OutboxPort, RoutePlugin } from '@bjm/shared';
import { ReserveStockUseCase } from './application/use-cases/ReserveStock.usecase';
import { PrismaInventoryRepository } from './infrastructure/persistence/PrismaInventoryRepository';
import { PrismaOutboxRepository } from './infrastructure/persistence/PrismaOutboxRepository';
import { PrismaIdempotencyStore } from './infrastructure/persistence/PrismaIdempotencyStore';
import { InventoryController } from './infrastructure/http/inventory.controller';
import { inventoryRoutes } from './infrastructure/http/inventory.routes';
import { ordersConsumerHandlers } from './infrastructure/kafka/orders.consumer';

export interface InventoryModule {
  routes: RoutePlugin[];
  consumerHandlers: ConsumerHandler<unknown>[];
  outboxPort: OutboxPort;
  idempotency: IdempotencyStore;
}

export function buildInventoryModule(): InventoryModule {
  const inventoryRepository = new PrismaInventoryRepository();
  const outboxPort = new PrismaOutboxRepository();
  const idempotency = new PrismaIdempotencyStore();

  const reserveStock = new ReserveStockUseCase(inventoryRepository);
  const controller = new InventoryController(inventoryRepository);

  return {
    routes: [inventoryRoutes(controller)],
    consumerHandlers: ordersConsumerHandlers(reserveStock),
    outboxPort,
    idempotency,
  };
}
