import { logger, newId } from '@bjm/shared';
import { PickingAssignedEventType, PickingAssignedVersion, Topics } from '@bjm/contracts';
import type { OutboxEvent, PickingLine, PickingRepository } from '../ports/PickingRepository';

export interface CreatePickingTaskInput {
  orderId: string;
  reservationId: string;
  items: PickingLine[];
  correlationId: string;
  causationId: string;
}

/** Creates a picking task once stock is reserved and emits `PickingAssigned`. */
export class CreatePickingTaskUseCase {
  constructor(private readonly picking: PickingRepository) {}

  async execute(input: CreatePickingTaskInput): Promise<void> {
    if (await this.picking.hasTaskForOrder(input.orderId)) {
      logger.info({ orderId: input.orderId }, 'picking task already exists, skipping');
      return;
    }

    const pickingTaskId = newId();
    const outbox: OutboxEvent = {
      eventId: newId(),
      topic: Topics.PickingAssigned,
      eventType: PickingAssignedEventType,
      eventVersion: PickingAssignedVersion,
      aggregateId: input.orderId,
      aggregateType: 'PickingTask',
      correlationId: input.correlationId,
      causationId: input.causationId,
      payload: {
        orderId: input.orderId,
        pickingTaskId,
        reservationId: input.reservationId,
        items: input.items,
      },
    };

    await this.picking.create(
      {
        id: pickingTaskId,
        orderId: input.orderId,
        reservationId: input.reservationId,
        items: input.items,
      },
      outbox,
    );

    logger.info({ orderId: input.orderId, pickingTaskId }, 'picking task created');
  }
}
