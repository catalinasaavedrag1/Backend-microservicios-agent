import type { FastifyInstance } from 'fastify';
import type { RoutePlugin } from '@bjm/shared';
import type { PickingController } from './picking.controller';

export function pickingRoutes(controller: PickingController): RoutePlugin {
  return (app: FastifyInstance) => {
    app.get('/picking-tasks', controller.list);
    app.get('/picking-tasks/:orderId', controller.getByOrder);
  };
}
