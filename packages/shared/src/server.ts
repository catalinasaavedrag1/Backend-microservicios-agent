import Fastify, { type FastifyInstance } from 'fastify';
import { registerCorrelation } from './http/correlation';
import { registerErrorHandler } from './errors/errorHandler';
import { registerHealthRoutes, type ReadinessCheck } from './health/health';

export type RoutePlugin = (app: FastifyInstance) => Promise<void> | void;

export interface BuildServerOptions {
  routes: RoutePlugin[];
  readiness?: ReadinessCheck[];
}

/**
 * Builds a Fastify instance wired with the cross-cutting concerns every service
 * needs: correlation ids, health/readiness probes and the centralised error
 * handler. Services only provide their own route plugins.
 */
export async function buildServer(options: BuildServerOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger: false, disableRequestLogging: true });

  registerCorrelation(app);
  registerHealthRoutes(app, options.readiness ?? []);

  for (const route of options.routes) {
    await app.register(async (instance) => {
      await route(instance);
    });
  }

  registerErrorHandler(app);
  return app;
}
