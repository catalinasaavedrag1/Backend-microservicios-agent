import type { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// `zodToJsonSchema` arrastra un tipo recursivo muy profundo; lo invocamos con una
// firma simplificada para evitar el error "Type instantiation is excessively deep".
const convert = zodToJsonSchema as (schema: unknown, options?: unknown) => Record<string, unknown>;

/**
 * Convierte un schema Zod en JSON Schema (draft-07) listo para usar en la opción
 * `schema` de una ruta Fastify. Así el mismo schema Zod es la única fuente de
 * verdad para validación **y** documentación OpenAPI (sin duplicar).
 */
export function toJsonSchema(schema: z.ZodTypeAny): Record<string, unknown> {
  const json = convert(schema, { target: 'jsonSchema7', $refStrategy: 'none' });
  delete json.$schema;
  return json;
}
