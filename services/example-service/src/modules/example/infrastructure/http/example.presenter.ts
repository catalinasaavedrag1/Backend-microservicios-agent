import type { Example } from '../../domain/Example';
import type { ExampleResponse } from './example.schemas';

/**
 * Presenter: mapea el agregado de dominio a un DTO de respuesta HTTP. Mantiene
 * los DTO separados de las entidades de dominio (CLAUDE.md) y serializa fechas a
 * ISO-8601.
 */
export function toExampleResponse(example: Example): ExampleResponse {
  const props = example.toJSON();
  return {
    id: props.id,
    name: props.name,
    status: props.status,
    ...(props.createdAt ? { createdAt: props.createdAt.toISOString() } : {}),
    ...(props.updatedAt ? { updatedAt: props.updatedAt.toISOString() } : {}),
  };
}
