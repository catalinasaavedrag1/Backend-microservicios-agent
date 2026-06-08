import type { FastifyInstance } from 'fastify';
import type { RoutePlugin } from '@bjm/shared';
import type { ExampleController } from './example.controller';
import { createExampleBodyJsonSchema, exampleIdParamsJsonSchema } from './example.schemas';

export function exampleRoutes(controller: ExampleController): RoutePlugin {
  return (app: FastifyInstance) => {
    app.post(
      '/examples',
      {
        schema: {
          tags: ['examples'],
          summary: 'Crear un example',
          body: createExampleBodyJsonSchema,
        },
      },
      controller.create,
    );

    app.get(
      '/examples/:id',
      {
        schema: {
          tags: ['examples'],
          summary: 'Obtener un example por id',
          params: exampleIdParamsJsonSchema,
        },
      },
      controller.getById,
    );
  };
}
