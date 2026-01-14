import { db } from './db.js';
import { maps, syncLog } from './schema.js';
import { eq, sql } from 'drizzle-orm';
import { createLoggerFactory } from './logger-core.js';

const { createLogger } = createLoggerFactory('info');
const syncLogger = createLogger('sync');

export interface DDNetMap {
  name: string;
  website?: string;
  thumbnail?: string;
  web_preview?: string;
  type: string;
  points: number;
  difficulty: number;
  mapper: string;
  release: string;
  width?: number;
  height?: number;
  tiles?: string[];
  median_time?: number;
  first_finish?: string;
  timestamp?: number;
}

export class MapSyncService {
  private static instance: MapSyncService;
  private lastSync: Date | null = null;
  private syncInProgress = false;

  static getInstance(): MapSyncService {
    if (!MapSyncService.instance) {
      MapSyncService.instance = new MapSyncService();
    }
    return MapSyncService.instance;
  }

  async shouldSync(): Promise<boolean> {
    if (this.syncInProgress) {
      syncLogger.warn('已有同步任务正在进行，跳过本次同步检查');
      return false;
    }

    const lastSyncRecord = await db
      .select()
      .from(syncLog)
      .where(eq(syncLog.status, 'success'))
      .orderBy(sql`${syncLog.syncedAt} DESC`)
      .limit(1);

    if (lastSyncRecord.length === 0) {
      syncLogger.info('未找到历史同步记录，需要执行同步');
      return true;
    }

    const lastSyncTime = lastSyncRecord[0].syncedAt;
    if (!lastSyncTime) {
      syncLogger.warn('历史同步记录时间无效，需要重新同步');
      return true;
    }

    const now = new Date();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const needSync = now.getTime() - lastSyncTime.getTime() > twentyFourHours;

    syncLogger.debug(`上次同步时间: ${lastSyncTime.toISOString()}，是否需要同步: ${needSync}`);

    return needSync;
  }

  async syncMaps(): Promise<{ success: boolean; message: string; count?: number }> {
    if (this.syncInProgress) {
      syncLogger.warn('同步任务已在进行中');
      return { success: false, message: '同步正在进行中' };
    }

    this.syncInProgress = true;
    const startTime = Date.now();

    try {
      syncLogger.info('开始同步 DDNet 地图数据');

      const response = await fetch('https://ddnet.org/releases/maps.json');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const ddnetMaps: DDNetMap[] = await response.json();
      syncLogger.info(`从 DDNet API 获取到 ${ddnetMaps.length} 个地图`);

      const insertData = ddnetMaps.map((map) => ({
        name: map.name,
        website: map.website || null,
        thumbnail: map.thumbnail || null,
        webPreview: map.web_preview || null,
        type: map.type,
        points: map.points,
        difficulty: map.difficulty,
        mapper: map.mapper,
        release: map.release,
        width: map.width || null,
        height: map.height || null,
        tiles: map.tiles ? JSON.stringify(map.tiles) : null,
        medianTime: map.median_time || null,
        firstFinish: map.first_finish || null,
        timestamp: map.timestamp || null,
      }));

      const result = db.transaction((tx) => {
        syncLogger.info('清空现有地图数据');
        tx.delete(maps).run();

        const batchSize = 100;
        let totalInserted = 0;

        for (let i = 0; i < insertData.length; i += batchSize) {
          const batch = insertData.slice(i, i + batchSize);
          tx.insert(maps).values(batch).run();
          totalInserted += batch.length;
        }

        return totalInserted;
      });

      await db.insert(syncLog).values({
        source: 'ddnet_api',
        status: 'success',
        recordCount: result,
      });

      this.lastSync = new Date();
      const duration = Date.now() - startTime;

      syncLogger.info(`地图数据同步完成，同步数量: ${result}，耗时: ${duration}ms`);

      return {
        success: true,
        message: `同步成功，共同步 ${result} 个地图`,
        count: result,
      };
    } catch (error) {
      syncLogger.error('同步地图数据过程中发生错误', error instanceof Error ? error : undefined);

      await db.insert(syncLog).values({
        source: 'ddnet_api',
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : '未知错误',
      });

      return {
        success: false,
        message: error instanceof Error ? error.message : '同步失败',
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  async getMapCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(maps);

    return result[0]?.count || 0;
  }

  async getLastSyncInfo(): Promise<{
    lastSync: Date | null;
    status: string;
    recordCount: number;
  }> {
    const lastSyncRecord = await db
      .select()
      .from(syncLog)
      .orderBy(sql`${syncLog.syncedAt} DESC`)
      .limit(1);

    if (lastSyncRecord.length === 0) {
      return {
        lastSync: null,
        status: 'never',
        recordCount: 0,
      };
    }

    const record = lastSyncRecord[0];
    return {
      lastSync: record.syncedAt,
      status: record.status,
      recordCount: record.recordCount || 0,
    };
  }
}
