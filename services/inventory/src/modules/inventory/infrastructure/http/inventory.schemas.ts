import { z } from 'zod';

export const UpsertStockBodySchema = z.object({
  sku: z.string().min(1),
  available: z.number().int().nonnegative(),
});

export type UpsertStockBody = z.infer<typeof UpsertStockBodySchema>;
