import type { FastifyReply, FastifyRequest } from 'fastify';
import { NotFoundError, parseWith } from '@bjm/shared';
import type { CreateOrderUseCase } from '../../application/use-cases/CreateOrder.usecase';
import type { OrderRepository } from '../../application/ports/OrderRepository';
import { CreateOrderBodySchema } from './orders.schemas';

/**
 * HTTP adapter. Controllers stay thin: validate input, delegate to a use case or
 * repository, map the result to a response. No business logic here
 * (CLAUDE.md section 3 "Evitar lógica de negocio en controllers").
 */
export class OrdersController {
  constructor(
    private readonly createOrder: CreateOrderUseCase,
    private readonly orders: OrderRepository,
  ) {}

  create = async (request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> => {
    const body = parseWith(CreateOrderBodySchema, request.body);
    const order = await this.createOrder.execute({
      customerId: body.customerId,
      currency: body.currency,
      items: body.items,
      correlationId: request.correlationId,
    });
    return reply.status(201).send({
      id: order.id,
      status: order.status,
      totalAmount: order.totalAmount,
    });
  };

  getById = async (request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> => {
    const { id } = request.params as { id: string };
    const order = await this.orders.findById(id);
    if (!order) {
      throw new NotFoundError('Order');
    }
    return reply.send(order.toJSON());
  };
}
