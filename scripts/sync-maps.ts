#!/usr/bin/env node

/**
 * DDNet 地图数据定时同步脚本
 * 直接使用 MapSyncService 进行数据同步，无需通过 HTTP 接口
 */

import { MapSyncService } from '../src/lib/server/mapSync.js';
import { syncLogger } from '../src/lib/server/logger.js';

// 主同步函数
async function runSync() {
  try {
    syncLogger.info('==================== DDNet 地图同步任务开始 ====================');

    const mapSyncService = MapSyncService.getInstance();

    // 检查是否需要同步
    const shouldSync = await mapSyncService.shouldSync();
    const lastSyncInfo = await mapSyncService.getLastSyncInfo();

    syncLogger.info(`上次同步时间: ${lastSyncInfo.lastSync || '从未同步'}`);
    syncLogger.info(`是否需要同步: ${shouldSync ? '是' : '否'}`);

    if (!shouldSync) {
      syncLogger.info('数据是最新的，无需同步');
      return;
    }

    // 执行同步
    syncLogger.info('开始同步地图数据...');
    const startTime = Date.now();

    const result = await mapSyncService.syncMaps();

    const duration = Date.now() - startTime;

    if (result.success) {
      syncLogger.info(`同步成功！耗时 ${duration}ms`);
      syncLogger.info(`同步地图数量: ${result.count || 0}`);
      syncLogger.info(`总地图数量: ${await mapSyncService.getMapCount()}`);
    } else {
      syncLogger.error(`同步失败: ${result.message || '未知错误'}`);
      process.exit(1);
    }
  } catch (error) {
    syncLogger.error('同步过程中发生错误', error instanceof Error ? error : undefined);
    process.exit(1);
  } finally {
    syncLogger.info('==================== DDNet 地图同步任务完成 ====================');
  }
}

// 运行同步
if (import.meta.url === `file://${process.argv[1]}`) {
  runSync().catch((error) => {
    syncLogger.error('脚本执行失败', error instanceof Error ? error : undefined);
    process.exit(1);
  });
}

export { runSync };
