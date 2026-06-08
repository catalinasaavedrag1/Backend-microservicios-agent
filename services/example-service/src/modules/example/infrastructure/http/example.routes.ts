import type { FastifyInstance } from 'fastify';
import type { RoutePlugin } from '@bjm/shared';
import type { ExampleController } from './example.controller';
import {
  createExampleBodyJsonSchema,
  exampleIdParamsJsonSchema,
  exampleListResponseJsonSchema,
  exampleResponseJsonSchema,
  listExamplesQueryJsonSchema,
  renameExampleBodyJsonSchema,
} from './example.schemas';

const TAGS = ['examples'];

/**
 * API REST del recurso `examples`, versionada bajo `/api/v1`. Cada ruta declara
 * su contrato (params/body/query/response) para que OpenAPI en `/docs` quede
 * documentado y la entrada se valide de forma consistente.
 */
export function exampleRoutes(controller: ExampleController): RoutePlugin {
  return async (app: FastifyInstance) => {
    await app.register(
      async (v1) => {
        v1.post(
          '/examples',
          {
            schema: {
              tags: TAGS,
              summary: 'Crear un example',
              body: createExampleBodyJsonSchema,
              response: { 201: exampleResponseJsonSchema },
            },
          },
          controller.create,
        );

        v1.get(
          '/examples',
          {
            schema: {
              tags: TAGS,
              summary: 'Listar examples (paginado)',
              querystring: listExamplesQueryJsonSchema,
              response: { 200: exampleListResponseJsonSchema },
            },
          },
          controller.list,
        );

        v1.get(
          '/examples/:id',
          {
            schema: {
              tags: TAGS,
              summary: 'Obtener un example por id',
              params: exampleIdParamsJsonSchema,
              response: { 200: exampleResponseJsonSchema },
            },
          },
          controller.getById,
        );

        v1.patch(
          '/examples/:id',
          {
            schema: {
              tags: TAGS,
              summary: 'Renombrar un example',
              params: exampleIdParamsJsonSchema,
              body: renameExampleBodyJsonSchema,
              response: { 200: exampleResponseJsonSchema },
            },
          },
          controller.rename,
        );

        v1.delete(
          '/examples/:id',
          {
            schema: {
              tags: TAGS,
              summary: 'Eliminar un example',
              params: exampleIdParamsJsonSchema,
            },
          },
          controller.remove,
        );
      },
      { prefix: '/api/v1' },
    );
  };
}
