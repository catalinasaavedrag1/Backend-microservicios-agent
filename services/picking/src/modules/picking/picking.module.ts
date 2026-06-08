import type { ConsumerHandler, IdempotencyStore, OutboxPort, RoutePlugin } from '@bjm/shared';
import { CreatePickingTaskUseCase } from './application/use-cases/CreatePickingTask.usecase';
import { PrismaPickingRepository } from './infrastructure/persistence/PrismaPickingRepository';
import { PrismaOutboxRepository } from './infrastructure/persistence/PrismaOutboxRepository';
import { PrismaIdempotencyStore } from './infrastructure/persistence/PrismaIdempotencyStore';
import { PickingController } from './infrastructure/http/picking.controller';
import { pickingRoutes } from './infrastructure/http/picking.routes';
import { inventoryConsumerHandlers } from './infrastructure/kafka/inventory.consumer';

export interface PickingModule {
  routes: RoutePlugin[];
  consumerHandlers: ConsumerHandler<unknown>[];
  outboxPort: OutboxPort;
  idempotency: IdempotencyStore;
}

export function buildPickingModule(): PickingModule {
  const pickingRepository = new PrismaPickingRepository();
  const outboxPort = new PrismaOutboxRepository();
  const idempotency = new PrismaIdempotencyStore();

  const createPickingTask = new CreatePickingTaskUseCase(pickingRepository);
  const controller = new PickingController(pickingRepository);

  return {
    routes: [pickingRoutes(controller)],
    consumerHandlers: inventoryConsumerHandlers(createPickingTask),
    outboxPort,
    idempotency,
  };
}
