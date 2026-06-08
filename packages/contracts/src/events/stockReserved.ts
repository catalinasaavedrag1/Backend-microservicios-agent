import { z } from 'zod';
import { domainEventSchema, type DomainEvent } from '../envelope';

export const StockReservedEventType = 'oms.inventory.stock-reserved';
export const StockReservedVersion = 1;

export const ReservedLineSchema = z.object({
  sku: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const StockReservedPayloadSchema = z.object({
  orderId: z.string().uuid(),
  reservationId: z.string().uuid(),
  items: z.array(ReservedLineSchema).min(1),
});

export type ReservedLine = z.infer<typeof ReservedLineSchema>;
export type StockReservedPayload = z.infer<typeof StockReservedPayloadSchema>;

export const StockReservedEventSchema = domainEventSchema(StockReservedPayloadSchema);
export type StockReservedEvent = DomainEvent<StockReservedPayload>;
