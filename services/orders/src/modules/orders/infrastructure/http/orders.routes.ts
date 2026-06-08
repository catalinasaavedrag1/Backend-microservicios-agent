import type { FastifyInstance } from 'fastify';
import type { RoutePlugin } from '@bjm/shared';
import type { OrdersController } from './orders.controller';

export function ordersRoutes(controller: OrdersController): RoutePlugin {
  return (app: FastifyInstance) => {
    app.post('/orders', controller.create);
    app.get('/orders/:id', controller.getById);
  };
}
