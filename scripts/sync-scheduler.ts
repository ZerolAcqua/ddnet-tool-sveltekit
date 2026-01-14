#!/usr/bin/env node

/**
 * DDNet 地图数据同步定时任务调度器
 * 使用 node-cron 执行定期同步任务
 */

import cron from 'node-cron';
import { runSync } from './sync-maps.js';
import { syncLogger } from './logger.js';

// 定时任务配置
const schedules = {
  // 每天凌晨 2 点执行同步
  daily: '0 2 * * *',
  // 每 6 小时执行一次（用于测试）
  sixHourly: '0 */6 * * *',
  // 每分钟执行一次（仅用于测试）
  everyMinute: '* * * * *',
};

// 包装同步函数以添加错误处理
async function wrappedSync() {
  try {
    await runSync();
  } catch (error) {
    syncLogger.error('定时同步执行失败', error instanceof Error ? error : undefined);
  }
}

// 启动定时任务
function startScheduler() {
  syncLogger.info('DDNet 地图同步调度器启动');

  // 获取环境变量中的调度配置，默认为每日同步
  const schedule = process.env.SYNC_SCHEDULE || schedules.daily;

  syncLogger.info(`使用调度配置: ${schedule}`);

  // 验证 cron 表达式
  if (!cron.validate(schedule)) {
    syncLogger.error(`无效的 cron 表达式: ${schedule}`);
    process.exit(1);
  }

  // 创建定时任务
  const task = cron.schedule(schedule, wrappedSync, {
    timezone: 'Asia/Shanghai',
  });

  // 启动任务
  task.start();

  syncLogger.info('定时任务已启动');
  syncLogger.info(`下次执行时间: ${getNextExecution(schedule)}`);

  // 如果是测试模式，立即执行一次
  if (process.env.RUN_IMMEDIATELY === 'true') {
    syncLogger.warn('测试模式：立即执行一次同步');
    wrappedSync();
  }

  // 优雅退出
  process.on('SIGINT', () => {
    syncLogger.warn('收到停止信号，正在关闭调度器');
    task.stop();
    syncLogger.info('调度器已停止');
    process.exit(0);
  });
}

// 获取下次执行时间（简化版本）
function getNextExecution(schedule: string): string {
  try {
    return '根据 cron 表达式计算';
  } catch {
    return '无法计算';
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  startScheduler();
}
