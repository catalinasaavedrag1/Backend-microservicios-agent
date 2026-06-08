import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  SERVICE_NAME: z.string().default('inventory-service'),
  PORT: z.coerce.number().int().positive().default(3002),
  DATABASE_URL: z.string().min(1),
  KAFKA_BROKERS: z
    .string()
    .default('localhost:9092')
    .transform((value) => value.split(',').map((b) => b.trim())),
  KAFKA_CLIENT_ID: z.string().default('inventory-service'),
  KAFKA_GROUP_ID: z.string().default('inventory-service'),
  LOG_LEVEL: z.string().default('info'),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
