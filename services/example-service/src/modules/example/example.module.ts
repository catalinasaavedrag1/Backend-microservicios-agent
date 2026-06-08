import type { ConsumerHandler, IdempotencyStore, OutboxPort, RoutePlugin } from '@bjm/shared';
import { CreateExampleUseCase } from './application/use-cases/CreateExample.usecase';
import { PublishExampleUseCase } from './application/use-cases/PublishExample.usecase';
import { PrismaExampleRepository } from './infrastructure/persistence/PrismaExampleRepository';
import { PrismaOutboxRepository } from './infrastructure/persistence/PrismaOutboxRepository';
import { PrismaIdempotencyStore } from './infrastructure/persistence/PrismaIdempotencyStore';
import { ExampleController } from './infrastructure/http/example.controller';
import { exampleRoutes } from './infrastructure/http/example.routes';
import { exampleConsumerHandlers } from './infrastructure/kafka/example.consumer';

export interface ExampleModule {
  routes: RoutePlugin[];
  consumerHandlers: ConsumerHandler<unknown>[];
  outboxPort: OutboxPort;
  idempotency: IdempotencyStore;
}

/** Raíz de composición del módulo (cablea el grafo de dependencias). */
export function buildExampleModule(): ExampleModule {
  const exampleRepository = new PrismaExampleRepository();
  const outboxPort = new PrismaOutboxRepository();
  const idempotency = new PrismaIdempotencyStore();

  const createExample = new CreateExampleUseCase(exampleRepository);
  const publishExample = new PublishExampleUseCase(exampleRepository);

  const controller = new ExampleController(createExample, exampleRepository);

  return {
    routes: [exampleRoutes(controller)],
    consumerHandlers: exampleConsumerHandlers(publishExample),
    outboxPort,
    idempotency,
  };
}
