// src/lib/server/logger-core.ts
// 日志核心模块，不依赖 $app，可被脚本使用

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levelWeight: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function formatDate(date = new Date()) {
  // 2026-01-12 23:41:08.123
  return date.toISOString().replace('T', ' ').replace('Z', '');
}

function log(level: LogLevel, message: string, meta: unknown, currentLevel: LogLevel) {
  if (levelWeight[level] < levelWeight[currentLevel]) return;

  const time = formatDate();
  const prefix = `[${time}] [${level.toUpperCase()}]`;

  if (meta !== undefined) {
    console[level === 'debug' ? 'log' : level](prefix, message, meta);
  } else {
    console[level === 'debug' ? 'log' : level](prefix, message);
  }
}

export function createLoggerFactory(currentLevel: LogLevel) {
  const baseLogger = {
    debug: (msg: string, meta?: unknown) => log('debug', msg, meta, currentLevel),
    info: (msg: string, meta?: unknown) => log('info', msg, meta, currentLevel),
    warn: (msg: string, meta?: unknown) => log('warn', msg, meta, currentLevel),
    error: (msg: string, meta?: unknown) => log('error', msg, meta, currentLevel),
  };

  function createLogger(scope: string) {
    return {
      debug: (msg: string, meta?: unknown) => baseLogger.debug(`[${scope}] ${msg}`, meta),
      info: (msg: string, meta?: unknown) => baseLogger.info(`[${scope}] ${msg}`, meta),
      warn: (msg: string, meta?: unknown) => baseLogger.warn(`[${scope}] ${msg}`, meta),
      error: (msg: string, meta?: unknown) => baseLogger.error(`[${scope}] ${msg}`, meta),
    };
  }

  return { baseLogger, createLogger };
}
