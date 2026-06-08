import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

// Resolve workspace libraries to their TypeScript sources so the test suite
// runs without a prior build step.
export default defineConfig({
  resolve: {
    alias: {
      '@bjm/contracts': resolve(__dirname, 'packages/contracts/src'),
      '@bjm/shared': resolve(__dirname, 'packages/shared/src'),
    },
  },
  test: {
    globals: false,
    environment: 'node',
    include: ['packages/**/*.test.ts', 'services/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['packages/**/src/**', 'services/**/src/**'],
      exclude: ['**/*.test.ts', '**/generated/**'],
    },
  },
});
