import { describe, expect, it } from 'vitest';
import { InvalidOrderStateError, Order } from '../src/modules/orders/domain/Order';
import { OrderStatus } from '../src/modules/orders/domain/OrderStatus';

describe('Order aggregate', () => {
  const items = [
    { sku: 'SKU-1', quantity: 2, unitPrice: 100 },
    { sku: 'SKU-2', quantity: 1, unitPrice: 50 },
  ];

  it('computes the total amount and starts as PENDING', () => {
    const order = Order.create({ id: 'o1', customerId: 'c1', currency: 'CLP', items });
    expect(order.totalAmount).toBe(250);
    expect(order.status).toBe(OrderStatus.Pending);
  });

  it('rejects creation without items', () => {
    expect(() => Order.create({ id: 'o1', customerId: 'c1', currency: 'CLP', items: [] })).toThrow(
      InvalidOrderStateError,
    );
  });

  it('confirms a pending order', () => {
    const order = Order.create({ id: 'o1', customerId: 'c1', currency: 'CLP', items });
    order.confirm();
    expect(order.status).toBe(OrderStatus.Confirmed);
  });

  it('forbids confirming an already confirmed order', () => {
    const order = Order.create({ id: 'o1', customerId: 'c1', currency: 'CLP', items });
    order.confirm();
    expect(() => order.confirm()).toThrow(InvalidOrderStateError);
  });
});
