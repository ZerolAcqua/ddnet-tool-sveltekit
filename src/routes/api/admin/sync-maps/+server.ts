import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MapSyncService } from '$lib/server/mapSync';
import { withAdminAuth } from '$lib/server/middleware';

export const POST: RequestHandler = withAdminAuth(async ({ request, user }) => {
  try {
    const { force } = await request.json().catch(() => ({ force: false }));

    const mapSyncService = MapSyncService.getInstance();

    // 检查是否需要强制同步
    if (!force && !(await mapSyncService.shouldSync())) {
      const lastSyncInfo = await mapSyncService.getLastSyncInfo();
      return json({
        success: false,
        message: '数据是最新的，无需同步',
        lastSync: lastSyncInfo.lastSync,
      });
    }

    console.log('开始手动同步地图数据...');
    const result = await mapSyncService.syncMaps();

    return json({
      success: result.success,
      message: result.success ? '地图数据同步成功' : result.message || '地图数据同步失败',
      syncedMaps: result.count || 0,
    });
  } catch (error) {
    console.error('同步地图数据时出错:', error);

    return json(
      {
        success: false,
        error: '同步失败',
        message: error instanceof Error ? error.message : '同步地图数据时出现未知错误',
      },
      { status: 500 }
    );
  }
});

// 获取同步状态
export const GET: RequestHandler = withAdminAuth(async ({ request, user }) => {
  try {
    const mapSyncService = MapSyncService.getInstance();
    const lastSyncInfo = await mapSyncService.getLastSyncInfo();
    const shouldSync = await mapSyncService.shouldSync();
    const mapCount = await mapSyncService.getMapCount();

    return json({
      lastSync: lastSyncInfo.lastSync,
      shouldSync,
      nextSyncDue: lastSyncInfo.lastSync
        ? new Date(lastSyncInfo.lastSync.getTime() + 24 * 60 * 60 * 1000)
        : null,
      lastSyncStatus: lastSyncInfo.status,
      currentMapCount: mapCount,
      lastSyncMaps: lastSyncInfo.recordCount,
    });
  } catch (error) {
    console.error('获取同步状态时出错:', error);

    return json(
      {
        error: '获取同步状态失败',
        message: error instanceof Error ? error.message : '获取同步状态时出现未知错误',
      },
      { status: 500 }
    );
  }
});
