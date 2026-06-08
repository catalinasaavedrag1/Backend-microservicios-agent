export const ExampleStatus = {
  Draft: 'DRAFT',
  Published: 'PUBLISHED',
} as const;

export type ExampleStatus = (typeof ExampleStatus)[keyof typeof ExampleStatus];
