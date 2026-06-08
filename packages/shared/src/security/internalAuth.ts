import type { FastifyRequest } from 'fastify';
import { UnauthorizedError } from '../errors/AppError';

export const INTERNAL_API_KEY_HEADER = 'x-internal-api-key';

/**
 * preHandler para autenticación servicio-a-servicio mediante una API key interna
 * compartida. Protege rutas que solo deberían invocar otros servicios:
 *
 * ```ts
 * app.post('/internal/sync', { preHandler: internalAuth(env.INTERNAL_API_KEY) }, handler);
 * ```
 *
 * Para autenticación de usuarios finales, sustitúyelo por verificación de JWT.
 */
export function internalAuth(expectedKey: string) {
  return async (request: FastifyRequest): Promise<void> => {
    const provided = request.headers[INTERNAL_API_KEY_HEADER];
    if (!expectedKey || provided !== expectedKey) {
      throw new UnauthorizedError('API key interna inválida o ausente');
    }
  };
}
