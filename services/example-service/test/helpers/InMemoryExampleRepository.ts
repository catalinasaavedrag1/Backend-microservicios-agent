import type {
  ExampleRepository,
  ListParams,
  OutboxEvent,
  Paginated,
} from '../../src/modules/example/application/ports/ExampleRepository';
import type { Example } from '../../src/modules/example/domain/Example';
import type { ExampleStatus } from '../../src/modules/example/domain/ExampleStatus';

/** Repositorio en memoria para los tests de use cases (sin BD). */
export class InMemoryExampleRepository implements ExampleRepository {
  readonly items: Example[] = [];
  readonly outbox: OutboxEvent[] = [];

  async create(example: Example, outbox: OutboxEvent[]): Promise<void> {
    this.items.push(example);
    this.outbox.push(...outbox);
  }

  async findById(id: string): Promise<Example | null> {
    return this.items.find((e) => e.id === id) ?? null;
  }

  async list(params: ListParams): Promise<Paginated<Example>> {
    return {
      items: this.items.slice(params.offset, params.offset + params.limit),
      total: this.items.length,
    };
  }

  async update(example: Example, outbox: OutboxEvent[] = []): Promise<void> {
    const index = this.items.findIndex((e) => e.id === example.id);
    if (index >= 0) this.items[index] = example;
    this.outbox.push(...outbox);
  }

  async updateStatus(
    _id: string,
    _status: ExampleStatus,
    outbox: OutboxEvent[] = [],
  ): Promise<void> {
    this.outbox.push(...outbox);
  }

  async delete(id: string): Promise<void> {
    const index = this.items.findIndex((e) => e.id === id);
    if (index >= 0) this.items.splice(index, 1);
  }
}
