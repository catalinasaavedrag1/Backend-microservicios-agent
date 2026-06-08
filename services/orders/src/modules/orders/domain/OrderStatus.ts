export const OrderStatus = {
  Pending: 'PENDING',
  Confirmed: 'CONFIRMED',
  Rejected: 'REJECTED',
  Cancelled: 'CANCELLED',
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];
