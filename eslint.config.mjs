// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/prisma/generated/**',
      '**/*.cjs',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Clean code guard-rails (see CLAUDE.md section "Reglas de clean code")
      'no-console': 'error',
      'no-debugger': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
    },
  },
  {
    // Boundaries de clean architecture: el dominio es puro.
    files: ['**/modules/**/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/application/**', '**/infrastructure/**'],
              message: 'El dominio no debe importar application ni infrastructure.',
            },
            {
              group: [
                '@prisma/client',
                '**/prisma/**',
                'fastify',
                '@fastify/*',
                'kafkajs',
                'pino',
                '@bjm/shared',
              ],
              message: 'El dominio es puro: sin dependencias de infraestructura.',
            },
          ],
        },
      ],
    },
  },
  {
    // La capa de aplicación habla con el mundo exterior solo a través de ports.
    files: ['**/modules/**/application/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/infrastructure/**'],
              message: 'application no debe importar infrastructure; usa los ports.',
            },
            {
              group: ['@prisma/client', 'fastify', '@fastify/*'],
              message: 'application no depende de infraestructura concreta (Prisma/Fastify).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.test.ts', '**/test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
