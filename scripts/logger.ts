// scripts/logger.ts
// 脚本专用日志模块，使用公共核心
import { createLoggerFactory } from '../src/lib/server/logger-core.js';

// 脚本中始终使用 info 级别
const { createLogger } = createLoggerFactory('info');

export const syncLogger = createLogger('sync');
