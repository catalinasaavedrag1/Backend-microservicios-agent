import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  SERVICE_NAME: z.string().default('example-service'),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1),
  KAFKA_BROKERS: z
    .string()
    .default('localhost:9092')
    .transform((value) => value.split(',').map((b) => b.trim())),
  KAFKA_CLIENT_ID: z.string().default('example-service'),
  KAFKA_GROUP_ID: z.string().default('example-service'),
  LOG_LEVEL: z.string().default('info'),
  // Seguridad
  CORS_ORIGIN: z
    .string()
    .default('false')
    .transform((value) => {
      if (value === 'true') return true;
      if (value === 'false') return false;
      return value.split(',').map((o) => o.trim());
    }),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW: z.string().default('1 minute'),
  // API key interna para llamadas servicio-a-servicio (opcional)
  INTERNAL_API_KEY: z.string().default(''),
});

/** Entorno validado y tipado. Falla rápido al arrancar si está mal configurado. */
export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
