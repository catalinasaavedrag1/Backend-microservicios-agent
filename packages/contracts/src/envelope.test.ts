import { describe, expect, it } from 'vitest';
import { ExampleCreatedEventSchema } from './events/exampleCreated';

describe('ExampleCreatedEventSchema', () => {
  const validEvent = {
    eventId: '11111111-1111-1111-1111-111111111111',
    eventType: 'example.created',
    eventVersion: 1,
    aggregateId: '22222222-2222-2222-2222-222222222222',
    aggregateType: 'Example',
    occurredAt: '2026-06-08T00:00:00.000Z',
    correlationId: 'corr-1',
    source: 'example-service',
    payload: {
      exampleId: '22222222-2222-2222-2222-222222222222',
      name: 'demo',
    },
  };

  it('acepta un evento bien formado', () => {
    expect(ExampleCreatedEventSchema.parse(validEvent)).toMatchObject({
      eventType: 'example.created',
    });
  });

  it('rechaza un evento con un nombre vacío en el payload', () => {
    const invalid = { ...validEvent, payload: { ...validEvent.payload, name: '' } };
    expect(ExampleCreatedEventSchema.safeParse(invalid).success).toBe(false);
  });

  it('rechaza un evento sin correlationId', () => {
    const { correlationId: _omit, ...rest } = validEvent;
    expect(ExampleCreatedEventSchema.safeParse(rest).success).toBe(false);
  });
});
