import type { FastifyReply, FastifyRequest } from 'fastify';
import { NotFoundError, parseWith } from '@bjm/shared';
import type { CreateExampleUseCase } from '../../application/use-cases/CreateExample.usecase';
import type { RenameExampleUseCase } from '../../application/use-cases/RenameExample.usecase';
import type { DeleteExampleUseCase } from '../../application/use-cases/DeleteExample.usecase';
import type { ExampleRepository } from '../../application/ports/ExampleRepository';
import {
  CreateExampleBodySchema,
  ListExamplesQuerySchema,
  RenameExampleBodySchema,
} from './example.schemas';
import { toExampleResponse } from './example.presenter';

/**
 * Adaptador HTTP. Los controllers son delgados: validan la entrada, delegan en
 * un use case (comandos) o el repositorio (consultas) y mapean a un DTO de
 * respuesta. Sin lógica de negocio aquí.
 */
export class ExampleController {
  constructor(
    private readonly createExample: CreateExampleUseCase,
    private readonly renameExample: RenameExampleUseCase,
    private readonly deleteExample: DeleteExampleUseCase,
    private readonly examples: ExampleRepository,
  ) {}

  create = async (request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> => {
    const body = parseWith(CreateExampleBodySchema, request.body);
    const example = await this.createExample.execute({
      name: body.name,
      correlationId: request.correlationId,
    });
    return reply.status(201).send(toExampleResponse(example));
  };

  list = async (request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> => {
    const { page, pageSize } = parseWith(ListExamplesQuerySchema, request.query);
    const { items, total } = await this.examples.list({
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    return reply.send({ items: items.map(toExampleResponse), page, pageSize, total });
  };

  getById = async (request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> => {
    const { id } = request.params as { id: string };
    const example = await this.examples.findById(id);
    if (!example) {
      throw new NotFoundError('Example');
    }
    return reply.send(toExampleResponse(example));
  };

  rename = async (request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> => {
    const { id } = request.params as { id: string };
    const body = parseWith(RenameExampleBodySchema, request.body);
    const example = await this.renameExample.execute({ id, name: body.name });
    return reply.send(toExampleResponse(example));
  };

  remove = async (request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> => {
    const { id } = request.params as { id: string };
    await this.deleteExample.execute(id);
    return reply.status(204).send();
  };
}
