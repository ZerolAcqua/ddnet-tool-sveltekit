// src/lib/server/logger.ts
import { dev } from '$app/environment';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levelWeight: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const currentLevel: LogLevel = dev ? 'debug' : 'info';

function formatDate(date = new Date()) {
  // 2026-01-12 23:41:08.123
  return date.toISOString().replace('T', ' ').replace('Z', '');
}

function log(level: LogLevel, message: string, meta?: unknown) {
  if (levelWeight[level] < levelWeight[currentLevel]) return;

  const time = formatDate();
  const prefix = `[${time}] [${level.toUpperCase()}]`;

  if (meta !== undefined) {
    console[level === 'debug' ? 'log' : level](prefix, message, meta);
  } else {
    console[level === 'debug' ? 'log' : level](prefix, message);
  }
}

export const logger = {
  debug: (msg: string, meta?: unknown) => log('debug', msg, meta),
  info: (msg: string, meta?: unknown) => log('info', msg, meta),
  warn: (msg: string, meta?: unknown) => log('warn', msg, meta),
  error: (msg: string, meta?: unknown) => log('error', msg, meta),
};

function createLogger(scope: string) {
  return {
    info: (msg: string, meta?: unknown) => logger.info(`[${scope}] ${msg}`, meta),
    warn: (msg: string, meta?: unknown) => logger.warn(`[${scope}] ${msg}`, meta),
    error: (msg: string, meta?: unknown) => logger.error(`[${scope}] ${msg}`, meta),
    debug: (msg: string, meta?: unknown) => logger.debug(`[${scope}] ${msg}`, meta),
  };
}

export const authLogger = createLogger('auth');
export const syncLogger = createLogger('sync');
