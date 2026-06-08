import type { FastifyInstance } from 'fastify';
import type { RoutePlugin } from '@bjm/shared';
import type { InventoryController } from './inventory.controller';

export function inventoryRoutes(controller: InventoryController): RoutePlugin {
  return (app: FastifyInstance) => {
    app.get('/stock', controller.list);
    app.put('/stock', controller.upsert);
  };
}
