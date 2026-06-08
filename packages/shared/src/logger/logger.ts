import pino from 'pino';

/**
 * Structured JSON logger. Sensitive fields are redacted so logs never carry
 * credentials or tokens (CLAUDE.md section 9 "Logs sin datos sensibles").
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: { service: process.env.SERVICE_NAME ?? 'service' },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token', '*.secret'],
    censor: '[redacted]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export type Logger = typeof logger;
