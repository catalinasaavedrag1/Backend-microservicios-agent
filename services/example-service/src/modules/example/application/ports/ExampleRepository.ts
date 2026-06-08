import type { Example } from '../../domain/Example';
import type { ExampleStatus } from '../../domain/ExampleStatus';

/** Evento listo para persistirse en el outbox dentro de la misma transacción. */
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

export interface ExampleRepository {
  /** Persiste un agregado nuevo junto con sus eventos de outbox, de forma atómica. */
  create(example: Example, outbox: OutboxEvent[]): Promise<void>;
  findById(id: string): Promise<Example | null>;
  /** Actualiza el estado (opcionalmente emitiendo eventos de outbox) de forma atómica. */
  updateStatus(id: string, status: ExampleStatus, outbox?: OutboxEvent[]): Promise<void>;
}
