import type { z } from 'zod';
import { ValidationError } from '../errors/AppError';

/**
 * Validates `data` against a Zod schema and returns a fully-typed value, or
 * throws a `ValidationError` carrying the flattened issues. Centralising
 * validation here keeps controllers free of ad-hoc checks.
 */
export function parseWith<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  data: unknown,
): z.infer<TSchema> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(result.error.flatten());
  }
  return result.data;
}
