import { db } from '$lib/server/db';
import { maps, syncLog } from '$lib/server/schema';
import { eq, sql } from 'drizzle-orm';

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
      return false;
    }

    // 检查最后一次同步时间
    const lastSyncRecord = await db
      .select()
      .from(syncLog)
      .where(eq(syncLog.status, 'success'))
      .orderBy(sql`${syncLog.syncedAt} DESC`)
      .limit(1);

    if (lastSyncRecord.length === 0) {
      return true; // 没有同步记录，需要同步
    }

    const lastSyncTime = lastSyncRecord[0].syncedAt;
    if (!lastSyncTime) {
      return true; // 同步时间无效，需要重新同步
    }
    
    const now = new Date();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    return (now.getTime() - lastSyncTime.getTime()) > twentyFourHours;
  }

  async syncMaps(): Promise<{ success: boolean; message: string; count?: number }> {
    if (this.syncInProgress) {
      return { success: false, message: '同步正在进行中' };
    }

    this.syncInProgress = true;

    try {
      console.log('开始同步 DDNet 地图数据...');

      // 从 DDNet API 获取数据
      const response = await fetch('https://ddnet.org/releases/maps.json');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const ddnetMaps: DDNetMap[] = await response.json();
      console.log(`从 DDNet API 获取到 ${ddnetMaps.length} 个地图`);

      // 准备插入数据
      const insertData = ddnetMaps.map(map => ({
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

      // 开始数据库事务（同步函数，不能使用 async/await）
      const result = db.transaction((tx) => {
        // 清空现有地图数据
        tx.delete(maps).run();

        // 分批插入数据（避免单次插入过多数据）
        const batchSize = 100;
        let totalInserted = 0;
        
        for (let i = 0; i < insertData.length; i += batchSize) {
          const batch = insertData.slice(i, i + batchSize);
          tx.insert(maps).values(batch).run();
          totalInserted += batch.length;
        }

        return totalInserted;
      });

      // 记录成功的同步
      await db.insert(syncLog).values({
        source: 'ddnet_api',
        status: 'success',
        recordCount: result,
      });

      this.lastSync = new Date();
      console.log(`地图数据同步完成，共同步 ${result} 个地图`);

      return { 
        success: true, 
        message: `同步成功，共同步 ${result} 个地图`,
        count: result
      };

    } catch (error) {
      console.error('同步地图数据失败:', error);

      // 记录失败的同步
      await db.insert(syncLog).values({
        source: 'ddnet_api',
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : '未知错误',
      });

      return { 
        success: false, 
        message: error instanceof Error ? error.message : '同步失败'
      };

    } finally {
      this.syncInProgress = false;
    }
  }

  async getMapCount(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(maps);
    
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
        recordCount: 0
      };
    }

    const record = lastSyncRecord[0];
    return {
      lastSync: record.syncedAt,
      status: record.status,
      recordCount: record.recordCount || 0
    };
  }
}