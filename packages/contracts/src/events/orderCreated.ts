import { z } from 'zod';
import { domainEventSchema, type DomainEvent } from '../envelope';

export const OrderCreatedEventType = 'oms.order.created';
export const OrderCreatedVersion = 1;

export const OrderLineSchema = z.object({
  sku: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
});

export const OrderCreatedPayloadSchema = z.object({
  orderId: z.string().uuid(),
  customerId: z.string().min(1),
  currency: z.string().length(3),
  totalAmount: z.number().nonnegative(),
  items: z.array(OrderLineSchema).min(1),
});

export type OrderLine = z.infer<typeof OrderLineSchema>;
export type OrderCreatedPayload = z.infer<typeof OrderCreatedPayloadSchema>;

export const OrderCreatedEventSchema = domainEventSchema(OrderCreatedPayloadSchema);
export type OrderCreatedEvent = DomainEvent<OrderCreatedPayload>;
