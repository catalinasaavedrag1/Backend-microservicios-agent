import { z } from 'zod';
import { toJsonSchema } from '@bjm/shared';

// --- Requests -------------------------------------------------------------

export const CreateExampleBodySchema = z.object({
  name: z.string().min(1).max(200),
});
export type CreateExampleBody = z.infer<typeof CreateExampleBodySchema>;

export const RenameExampleBodySchema = z.object({
  name: z.string().min(1).max(200),
});
export type RenameExampleBody = z.infer<typeof RenameExampleBodySchema>;

export const ListExamplesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
export type ListExamplesQuery = z.infer<typeof ListExamplesQuerySchema>;

// --- Responses (también documentan y serializan en OpenAPI) ---------------

export const ExampleResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: z.enum(['DRAFT', 'PUBLISHED']),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type ExampleResponse = z.infer<typeof ExampleResponseSchema>;

export const ExampleListResponseSchema = z.object({
  items: z.array(ExampleResponseSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});

// --- JSON Schemas derivados (única fuente de verdad: el mismo Zod valida y
//     documenta). --------------------------------------------------------

export const createExampleBodyJsonSchema = toJsonSchema(CreateExampleBodySchema);
export const renameExampleBodyJsonSchema = toJsonSchema(RenameExampleBodySchema);
export const listExamplesQueryJsonSchema = toJsonSchema(ListExamplesQuerySchema);
export const exampleResponseJsonSchema = toJsonSchema(ExampleResponseSchema);
export const exampleListResponseJsonSchema = toJsonSchema(ExampleListResponseSchema);

export const exampleIdParamsJsonSchema = {
  type: 'object',
  properties: { id: { type: 'string', format: 'uuid' } },
  required: ['id'],
  additionalProperties: false,
} as const;
