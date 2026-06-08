import type { FastifyReply, FastifyRequest } from 'fastify';
import { NotFoundError, parseWith } from '@bjm/shared';
import type { CreateExampleUseCase } from '../../application/use-cases/CreateExample.usecase';
import type { ExampleRepository } from '../../application/ports/ExampleRepository';
import { CreateExampleBodySchema } from './example.schemas';

/**
 * Adaptador HTTP. Los controllers son delgados: validan la entrada, delegan en
 * un use case o repositorio y mapean el resultado a la respuesta. Sin lógica de
 * negocio aquí.
 */
export class ExampleController {
  constructor(
    private readonly createExample: CreateExampleUseCase,
    private readonly examples: ExampleRepository,
  ) {}

  create = async (request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> => {
    const body = parseWith(CreateExampleBodySchema, request.body);
    const example = await this.createExample.execute({
      name: body.name,
      correlationId: request.correlationId,
    });
    return reply.status(201).send({ id: example.id, status: example.status });
  };

  getById = async (request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> => {
    const { id } = request.params as { id: string };
    const example = await this.examples.findById(id);
    if (!example) {
      throw new NotFoundError('Example');
    }
    return reply.send(example.toJSON());
  };
}
