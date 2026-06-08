import type { FastifyReply, FastifyRequest } from 'fastify';
import { NotFoundError } from '@bjm/shared';
import type { PickingRepository } from '../../application/ports/PickingRepository';

export class PickingController {
  constructor(private readonly picking: PickingRepository) {}

  list = async (_request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> => {
    return reply.send({ tasks: await this.picking.listTasks() });
  };

  getByOrder = async (request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> => {
    const { orderId } = request.params as { orderId: string };
    const task = await this.picking.findByOrderId(orderId);
    if (!task) {
      throw new NotFoundError('PickingTask');
    }
    return reply.send(task);
  };
}
