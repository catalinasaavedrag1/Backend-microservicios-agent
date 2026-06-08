import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from './AppError';
import { logger } from '../logger/logger';

interface ErrorBody {
  error: { code: string; message: string; details?: unknown };
}

/**
 * Centralised error handler: maps every thrown error to a consistent JSON shape
 * and ensures unexpected errors never leak internals to the client
 * (CLAUDE.md section 5 "Manejo de errores consistente").
 */
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    const correlationId = request.headers['x-correlation-id'];

    if (error instanceof AppError) {
      logger.warn({ code: error.code, correlationId, err: error }, 'handled application error');
      const body: ErrorBody = {
        error: { code: error.code, message: error.message, details: error.details },
      };
      return reply.status(error.statusCode).send(body);
    }

    if (error.validation) {
      const body: ErrorBody = {
        error: { code: 'VALIDATION_ERROR', message: error.message, details: error.validation },
      };
      return reply.status(400).send(body);
    }

    logger.error({ correlationId, err: error }, 'unhandled error');
    const body: ErrorBody = {
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    };
    return reply.status(500).send(body);
  });
}
