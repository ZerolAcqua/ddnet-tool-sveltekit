// src/lib/server/logger.ts
import { dev } from '$app/environment';
import { createLoggerFactory } from './logger-core.js';

const currentLevel = dev ? 'debug' : 'info';
const { baseLogger: logger, createLogger } = createLoggerFactory(currentLevel);

export const authLogger = createLogger('auth');
export const syncLogger = createLogger('sync');
export { logger };
