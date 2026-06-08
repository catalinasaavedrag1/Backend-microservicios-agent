import { z } from 'zod';
import { domainEventSchema, type DomainEvent } from '../envelope';

export const ReservationFailedEventType = 'oms.inventory.reservation-failed';
export const ReservationFailedVersion = 1;

export const ShortageSchema = z.object({
  sku: z.string().min(1),
  requested: z.number().int().positive(),
  available: z.number().int().nonnegative(),
});

export const ReservationFailedPayloadSchema = z.object({
  orderId: z.string().uuid(),
  reason: z.string().min(1),
  shortages: z.array(ShortageSchema),
});

export type Shortage = z.infer<typeof ShortageSchema>;
export type ReservationFailedPayload = z.infer<typeof ReservationFailedPayloadSchema>;

export const ReservationFailedEventSchema = domainEventSchema(ReservationFailedPayloadSchema);
export type ReservationFailedEvent = DomainEvent<ReservationFailedPayload>;
