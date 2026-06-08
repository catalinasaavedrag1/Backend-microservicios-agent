/**
 * Topic catalog. Topics are versioned in their name so that a breaking change to
 * an event schema becomes a new topic (`...v2`) instead of silently breaking
 * existing consumers.
 */
export const Topics = {
  OrderCreated: 'oms.orders.order-created.v1',
  StockReserved: 'oms.inventory.stock-reserved.v1',
  ReservationFailed: 'oms.inventory.reservation-failed.v1',
  PickingAssigned: 'oms.picking.picking-assigned.v1',
} as const;

export type Topic = (typeof Topics)[keyof typeof Topics];

/** Dead Letter Queue topic name derived from any source topic. */
export const dlqTopic = (topic: string): string => `${topic}.dlq`;
