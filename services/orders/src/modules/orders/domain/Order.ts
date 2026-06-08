import { OrderStatus } from './OrderStatus';

export interface OrderItem {
  sku: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderProps {
  id: string;
  customerId: string;
  status: OrderStatus;
  currency: string;
  items: OrderItem[];
  totalAmount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Thrown when a domain invariant or illegal state transition is violated. */
export class InvalidOrderStateError extends Error {}

/**
 * Order aggregate. Holds the state-transition rules; it has no knowledge of
 * persistence, HTTP or Kafka (CLAUDE.md section 6 / clean architecture).
 */
export class Order {
  private constructor(private readonly props: OrderProps) {}

  static create(input: {
    id: string;
    customerId: string;
    currency: string;
    items: OrderItem[];
  }): Order {
    if (input.items.length === 0) {
      throw new InvalidOrderStateError('An order must contain at least one item');
    }
    const totalAmount = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    return new Order({
      id: input.id,
      customerId: input.customerId,
      currency: input.currency,
      items: input.items,
      status: OrderStatus.Pending,
      totalAmount,
    });
  }

  static rehydrate(props: OrderProps): Order {
    return new Order(props);
  }

  confirm(): void {
    this.assertPending('confirm');
    this.props.status = OrderStatus.Confirmed;
  }

  reject(): void {
    this.assertPending('reject');
    this.props.status = OrderStatus.Rejected;
  }

  private assertPending(action: string): void {
    if (this.props.status !== OrderStatus.Pending) {
      throw new InvalidOrderStateError(`Cannot ${action} an order in status ${this.props.status}`);
    }
  }

  get id(): string {
    return this.props.id;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get status(): OrderStatus {
    return this.props.status;
  }

  get currency(): string {
    return this.props.currency;
  }

  get items(): readonly OrderItem[] {
    return this.props.items;
  }

  get totalAmount(): number {
    return this.props.totalAmount;
  }

  toJSON(): OrderProps {
    return { ...this.props, items: this.props.items.map((item) => ({ ...item })) };
  }
}
