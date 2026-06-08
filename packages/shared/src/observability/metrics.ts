import type { FastifyInstance } from 'fastify';
import client from 'prom-client';

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duración de las peticiones HTTP en segundos',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

/**
 * Registra métricas Prometheus: métricas por defecto del proceso (CPU, memoria,
 * event loop) más un histograma de latencia HTTP, expuestas en `/metrics`.
 * Para métricas de negocio, crea tus propios contadores con el `client`.
 */
export function registerMetrics(app: FastifyInstance): void {
  app.addHook('onResponse', async (request, reply) => {
    const route = request.routeOptions?.url ?? request.url;
    httpRequestDuration.observe(
      { method: request.method, route, status_code: reply.statusCode },
      reply.elapsedTime / 1000,
    );
  });

  app.get('/metrics', async (_request, reply) => {
    reply.header('content-type', register.contentType);
    return register.metrics();
  });
}

/** Registro Prometheus compartido, por si un servicio quiere añadir métricas. */
export const metricsRegistry = register;
export { client as promClient };
