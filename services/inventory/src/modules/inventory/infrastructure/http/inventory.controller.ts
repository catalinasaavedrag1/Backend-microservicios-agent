import type { FastifyReply, FastifyRequest } from 'fastify';
import { parseWith } from '@bjm/shared';
import type { InventoryRepository } from '../../application/ports/InventoryRepository';
import { UpsertStockBodySchema } from './inventory.schemas';

export class InventoryController {
  constructor(private readonly inventory: InventoryRepository) {}

  list = async (_request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> => {
    return reply.send({ items: await this.inventory.listStock() });
  };

  upsert = async (request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> => {
    const body = parseWith(UpsertStockBodySchema, request.body);
    const item = await this.inventory.upsertStock(body.sku, body.available);
    return reply.status(200).send(item);
  };
}
