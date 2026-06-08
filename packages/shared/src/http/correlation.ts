import type { FastifyInstance, FastifyRequest } from 'fastify';
import { newId } from '../ids';

declare module 'fastify' {
  interface FastifyRequest {
    correlationId: string;
  }
}

/**
 * Ensures every request carries a correlation id (propagated from the caller via
 * `x-correlation-id` or generated) and echoes it back on the response so it can
 * be followed across services and into emitted events.
 */
export function registerCorrelation(app: FastifyInstance): void {
  app.decorateRequest('correlationId', '');
  app.addHook('onRequest', async (request: FastifyRequest, reply) => {
    const incoming = request.headers['x-correlation-id'];
    const correlationId = typeof incoming === 'string' && incoming.length > 0 ? incoming : newId();
    request.correlationId = correlationId;
    reply.header('x-correlation-id', correlationId);
  });
}
