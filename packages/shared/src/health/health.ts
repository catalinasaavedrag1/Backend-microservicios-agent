import type { FastifyInstance } from 'fastify';

export interface ReadinessCheck {
  name: string;
  check: () => Promise<boolean>;
}

/**
 * Registers liveness (`/health`) and readiness (`/ready`) probes. Liveness only
 * reports the process is up; readiness runs dependency checks (DB, broker) and
 * returns 503 when any dependency is unavailable.
 */
export function registerHealthRoutes(app: FastifyInstance, checks: ReadinessCheck[] = []): void {
  app.get('/health', async () => ({ status: 'ok', uptime: process.uptime() }));

  app.get('/ready', async (_request, reply) => {
    const results = await Promise.all(
      checks.map(async (c) => ({ name: c.name, ok: await c.check().catch(() => false) })),
    );
    const ready = results.every((r) => r.ok);
    return reply.status(ready ? 200 : 503).send({
      status: ready ? 'ready' : 'degraded',
      checks: results,
    });
  });
}
