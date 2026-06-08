export interface OutboxEvent {
  eventId: string;
  topic: string;
  eventType: string;
  eventVersion: number;
  aggregateId: string;
  aggregateType: string;
  correlationId: string;
  causationId?: string;
  payload: unknown;
}

export interface PickingLine {
  sku: string;
  quantity: number;
}

export interface CreatePickingTaskCommand {
  id: string;
  orderId: string;
  reservationId: string;
  items: PickingLine[];
}

export interface PickingTaskView {
  id: string;
  orderId: string;
  reservationId: string;
  status: string;
  items: PickingLine[];
}

export interface PickingRepository {
  hasTaskForOrder(orderId: string): Promise<boolean>;
  /** Creates the picking task and persists the outbox event atomically. */
  create(command: CreatePickingTaskCommand, outbox: OutboxEvent): Promise<void>;
  listTasks(): Promise<PickingTaskView[]>;
  findByOrderId(orderId: string): Promise<PickingTaskView | null>;
}
