import { z } from 'zod';
import { toJsonSchema } from '@bjm/shared';

export const CreateExampleBodySchema = z.object({
  name: z.string().min(1),
});

export type CreateExampleBody = z.infer<typeof CreateExampleBodySchema>;

// JSON Schema derivado del Zod para documentar la ruta en OpenAPI (única fuente
// de verdad: el mismo schema valida y documenta).
export const createExampleBodyJsonSchema = toJsonSchema(CreateExampleBodySchema);

export const exampleIdParamsJsonSchema = {
  type: 'object',
  properties: { id: { type: 'string', format: 'uuid' } },
  required: ['id'],
  additionalProperties: false,
} as const;
