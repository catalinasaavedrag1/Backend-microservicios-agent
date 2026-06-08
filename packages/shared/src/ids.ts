import { randomUUID } from 'node:crypto';

/** Generates a RFC-4122 v4 identifier (used for ids, event ids, correlation ids). */
export const newId = (): string => randomUUID();
