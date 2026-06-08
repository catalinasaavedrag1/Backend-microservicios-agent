import type { FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';

export interface SecurityOptions {
  /** Orígenes CORS permitidos. Por defecto `false` (sin cross-origin). */
  cors?: { origin?: string | string[] | boolean };
  /** Límite de peticiones por ventana. */
  rateLimit?: { max?: number; timeWindow?: string | number };
}

/**
 * Registra los controles de seguridad de entrada que todo servicio debería
 * exponer (CLAUDE.md §9): cabeceras seguras (helmet), CORS controlado y rate
 * limiting. Los valores por defecto son restrictivos a propósito.
 */
export async function registerSecurity(
  app: FastifyInstance,
  options: SecurityOptions = {},
): Promise<void> {
  await app.register(helmet);
  await app.register(cors, { origin: options.cors?.origin ?? false });
  await app.register(rateLimit, {
    max: options.rateLimit?.max ?? 100,
    timeWindow: options.rateLimit?.timeWindow ?? '1 minute',
  });
}
