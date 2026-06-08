import Fastify, { type FastifyInstance } from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { registerCorrelation } from './http/correlation';
import { registerErrorHandler } from './errors/errorHandler';
import { registerHealthRoutes, type ReadinessCheck } from './health/health';
import { registerSecurity, type SecurityOptions } from './security/security';
import { registerMetrics } from './observability/metrics';

export type RoutePlugin = (app: FastifyInstance) => Promise<void> | void;

export interface OpenApiOptions {
  title: string;
  description?: string;
  version: string;
  /** Prefijo donde se sirve la UI de Swagger. Por defecto `/docs`. */
  routePrefix?: string;
}

export interface BuildServerOptions {
  routes: RoutePlugin[];
  readiness?: ReadinessCheck[];
  openapi?: OpenApiOptions;
  /** Seguridad de entrada (helmet + CORS + rate limit). Omitir la desactiva. */
  security?: SecurityOptions;
  /** Expone métricas Prometheus en `/metrics`. Por defecto activado. */
  metrics?: boolean;
}

/**
 * Construye una instancia Fastify cableada con los temas transversales que todo
 * servicio necesita: correlation ids, sondas de health/readiness, OpenAPI
 * opcional y el handler central de errores. Cada servicio solo aporta sus rutas.
 */
export async function buildServer(options: BuildServerOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger: false, disableRequestLogging: true });

  registerCorrelation(app);

  if (options.security) {
    await registerSecurity(app, options.security);
  }

  if (options.metrics !== false) {
    registerMetrics(app);
  }

  if (options.openapi) {
    await app.register(fastifySwagger, {
      openapi: {
        openapi: '3.0.3',
        info: {
          title: options.openapi.title,
          description: options.openapi.description ?? '',
          version: options.openapi.version,
        },
      },
    });
  }

  registerHealthRoutes(app, options.readiness ?? []);

  for (const route of options.routes) {
    await app.register(async (instance) => {
      await route(instance);
    });
  }

  if (options.openapi) {
    await app.register(fastifySwaggerUi, {
      routePrefix: options.openapi.routePrefix ?? '/docs',
    });
  }

  registerErrorHandler(app);
  return app;
}
