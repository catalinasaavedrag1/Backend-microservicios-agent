import { z } from 'zod';

export const CreateOrderBodySchema = z.object({
  customerId: z.string().min(1),
  currency: z.string().length(3),
  items: z
    .array(
      z.object({
        sku: z.string().min(1),
        quantity: z.number().int().positive(),
        unitPrice: z.number().nonnegative(),
      }),
    )
    .min(1),
});

export type CreateOrderBody = z.infer<typeof CreateOrderBodySchema>;
