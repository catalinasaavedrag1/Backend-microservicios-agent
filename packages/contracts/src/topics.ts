/**
 * Convención de nombres de topics: `<dominio>.<evento>.v<version>`.
 *
 * Versionar el topic en el nombre hace que un cambio incompatible se convierta en
 * un topic nuevo (`...v2`) en lugar de romper en silencio a los consumidores
 * existentes.
 */
export const topicName = (domain: string, event: string, version = 1): string =>
  `${domain}.${event}.v${version}`;

/**
 * Catálogo de topics. Cada proyecto declara aquí los suyos; los del servicio de
 * ejemplo (plantilla) se incluyen como referencia.
 */
export const Topics = {
  ExampleCreated: topicName('example', 'example-created', 1),
} as const;

export type Topic = (typeof Topics)[keyof typeof Topics];

/** Nombre del topic de Dead Letter Queue derivado de cualquier topic de origen. */
export const dlqTopic = (topic: string): string => `${topic}.dlq`;
