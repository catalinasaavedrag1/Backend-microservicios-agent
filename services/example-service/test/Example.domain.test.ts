import { describe, expect, it } from 'vitest';
import { Example, InvalidExampleStateError } from '../src/modules/example/domain/Example';
import { ExampleStatus } from '../src/modules/example/domain/ExampleStatus';

describe('Example aggregate', () => {
  it('arranca en estado DRAFT', () => {
    const example = Example.create({ id: 'e1', name: 'demo' });
    expect(example.status).toBe(ExampleStatus.Draft);
  });

  it('rechaza la creación con nombre vacío', () => {
    expect(() => Example.create({ id: 'e1', name: '  ' })).toThrow(InvalidExampleStateError);
  });

  it('publica un example y es idempotente', () => {
    const example = Example.create({ id: 'e1', name: 'demo' });
    example.publish();
    example.publish();
    expect(example.status).toBe(ExampleStatus.Published);
  });
});
