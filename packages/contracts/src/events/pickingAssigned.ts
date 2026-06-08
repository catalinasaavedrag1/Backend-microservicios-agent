import { z } from 'zod';
import { domainEventSchema, type DomainEvent } from '../envelope';

export const PickingAssignedEventType = 'oms.picking.assigned';
export const PickingAssignedVersion = 1;

export const PickingLineSchema = z.object({
  sku: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const PickingAssignedPayloadSchema = z.object({
  orderId: z.string().uuid(),
  pickingTaskId: z.string().uuid(),
  reservationId: z.string().uuid(),
  items: z.array(PickingLineSchema).min(1),
});

export type PickingLine = z.infer<typeof PickingLineSchema>;
export type PickingAssignedPayload = z.infer<typeof PickingAssignedPayloadSchema>;

export const PickingAssignedEventSchema = domainEventSchema(PickingAssignedPayloadSchema);
export type PickingAssignedEvent = DomainEvent<PickingAssignedPayload>;
