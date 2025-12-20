#!/usr/bin/env node

/**
 * DDNet 地图数据定时同步脚本
 * 直接使用 MapSyncService 进行数据同步，无需通过 HTTP 接口
 */

import { MapSyncService } from '../src/lib/server/mapSync.js';

// 日志函数
function log(message: string, level: 'info' | 'error' | 'warn' = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : 'ℹ️';
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

// 主同步函数
async function runSync() {
  try {
    log('==================== DDNet 地图同步任务开始 ====================');
    
    const mapSyncService = MapSyncService.getInstance();
    
    // 检查是否需要同步
    const shouldSync = await mapSyncService.shouldSync();
    const lastSyncInfo = await mapSyncService.getLastSyncInfo();
    
    log(`上次同步时间: ${lastSyncInfo.lastSync || '从未同步'}`);
    log(`是否需要同步: ${shouldSync ? '是' : '否'}`);
    
    if (!shouldSync) {
      log('数据是最新的，无需同步');
      log('==================== DDNet 地图同步任务完成 ====================');
      return;
    }
    
    // 执行同步
    log('开始同步地图数据...');
    const startTime = Date.now();
    
    const result = await mapSyncService.syncMaps();
    
    const duration = Date.now() - startTime;
    
    if (result.success) {
      log(`同步成功！耗时 ${duration}ms`, 'info');
      log(`同步地图数量: ${result.count || 0}`);
      log(`总地图数量: ${await mapSyncService.getMapCount()}`);
    } else {
      log(`同步失败: ${result.message || '未知错误'}`, 'error');
      process.exit(1);
    }
    
  } catch (error) {
    log(`同步过程中发生错误: ${error instanceof Error ? error.message : '未知错误'}`, 'error');
    console.error(error);
    process.exit(1);
  } finally {
    log('==================== DDNet 地图同步任务完成 ====================');
  }
}

// 运行同步
if (import.meta.url === `file://${process.argv[1]}`) {
  runSync().catch((error) => {
    log(`脚本执行失败: ${error.message}`, 'error');
    process.exit(1);
  });
}

export { runSync };