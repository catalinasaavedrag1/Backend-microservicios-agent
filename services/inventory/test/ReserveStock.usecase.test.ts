import { describe, expect, it } from 'vitest';
import { Topics } from '@bjm/contracts';
import { ReserveStockUseCase } from '../src/modules/inventory/application/use-cases/ReserveStock.usecase';
import type {
  InventoryRepository,
  OutboxEvent,
  ReserveCommand,
  ReserveResult,
  StockItemView,
} from '../src/modules/inventory/application/ports/InventoryRepository';

class InMemoryInventoryRepository implements InventoryRepository {
  readonly outbox: OutboxEvent[] = [];
  private readonly reservations = new Set<string>();

  constructor(private readonly stock: Map<string, number>) {}

  async hasReservation(orderId: string): Promise<boolean> {
    return this.reservations.has(orderId);
  }

  async reserve(
    command: ReserveCommand,
    toOutbox: (result: ReserveResult) => OutboxEvent,
  ): Promise<ReserveResult> {
    const shortages = command.items
      .map((item) => ({
        sku: item.sku,
        requested: item.quantity,
        available: this.stock.get(item.sku) ?? 0,
      }))
      .filter((s) => s.available < s.requested);

    const result: ReserveResult =
      shortages.length > 0
        ? { status: 'failed', reason: 'INSUFFICIENT_STOCK', shortages }
        : { status: 'reserved', reservationId: command.reservationId, items: command.items };

    if (result.status === 'reserved') {
      for (const item of command.items) {
        this.stock.set(item.sku, (this.stock.get(item.sku) ?? 0) - item.quantity);
      }
      this.reservations.add(command.orderId);
    }
    this.outbox.push(toOutbox(result));
    return result;
  }

  async listStock(): Promise<StockItemView[]> {
    return [...this.stock.entries()].map(([sku, available]) => ({ sku, available, reserved: 0 }));
  }

  async upsertStock(sku: string, available: number): Promise<StockItemView> {
    this.stock.set(sku, available);
    return { sku, available, reserved: 0 };
  }
}

const orderId = '22222222-2222-2222-2222-222222222222';

describe('ReserveStockUseCase', () => {
  it('emits StockReserved when stock is sufficient', async () => {
    const repo = new InMemoryInventoryRepository(new Map([['SKU-1', 10]]));
    const useCase = new ReserveStockUseCase(repo);

    await useCase.execute({
      orderId,
      items: [{ sku: 'SKU-1', quantity: 4 }],
      correlationId: 'corr-1',
      causationId: 'evt-1',
    });

    expect(repo.outbox).toHaveLength(1);
    expect(repo.outbox[0]?.topic).toBe(Topics.StockReserved);
    expect(repo.outbox[0]?.causationId).toBe('evt-1');
  });

  it('emits ReservationFailed with shortages when stock is insufficient', async () => {
    const repo = new InMemoryInventoryRepository(new Map([['SKU-1', 1]]));
    const useCase = new ReserveStockUseCase(repo);

    await useCase.execute({
      orderId,
      items: [{ sku: 'SKU-1', quantity: 4 }],
      correlationId: 'corr-1',
      causationId: 'evt-1',
    });

    expect(repo.outbox).toHaveLength(1);
    expect(repo.outbox[0]?.topic).toBe(Topics.ReservationFailed);
    expect(repo.outbox[0]?.payload).toMatchObject({
      reason: 'INSUFFICIENT_STOCK',
      shortages: [{ sku: 'SKU-1', requested: 4, available: 1 }],
    });
  });

  it('skips when a reservation already exists (idempotent)', async () => {
    const repo = new InMemoryInventoryRepository(new Map([['SKU-1', 10]]));
    const useCase = new ReserveStockUseCase(repo);
    const input = {
      orderId,
      items: [{ sku: 'SKU-1', quantity: 1 }],
      correlationId: 'corr-1',
      causationId: 'evt-1',
    };

    await useCase.execute(input);
    await useCase.execute(input);

    expect(repo.outbox).toHaveLength(1);
  });
});
