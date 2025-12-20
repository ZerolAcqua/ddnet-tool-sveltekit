import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { maps } from '$lib/server/schema';
import { MapSyncService } from '$lib/server/mapSync';
import { like, and, gte, lte, eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const mapSyncService = MapSyncService.getInstance();
    
    // 检查是否需要同步数据
    if (await mapSyncService.shouldSync()) {
      console.log('检测到需要同步数据，开始后台同步...');
      // 异步同步，不阻塞当前请求
      mapSyncService.syncMaps().catch(console.error);
    }

    // 获取查询参数
    const searchParams = url.searchParams;
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const minDifficulty = searchParams.get('minDifficulty');
    const maxDifficulty = searchParams.get('maxDifficulty');

    // 构建查询
    const conditions = [];
    
    if (search) {
      conditions.push(
        like(maps.name, `%${search}%`) // 可以扩展为 OR mapper LIKE
      );
    }
    
    if (type && type !== 'all') {
      conditions.push(eq(maps.type, type));
    }
    
    if (minDifficulty !== null) {
      const min = parseInt(minDifficulty || '0');
      conditions.push(gte(maps.difficulty, min));
    }
    
    if (maxDifficulty !== null) {
      const max = parseInt(maxDifficulty || '5');
      conditions.push(lte(maps.difficulty, max));
    }

    // 执行查询
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const mapData = await db.select().from(maps).where(whereClause);

    // 转换数据格式（解析 JSON 字段）
    const formattedMaps = mapData.map(map => ({
      ...map,
      tiles: map.tiles ? JSON.parse(map.tiles) : null,
      // 重命名字段以匹配前端期望的格式
      web_preview: map.webPreview,
      median_time: map.medianTime,
      first_finish: map.firstFinish,
    }));

    return json({
      data: formattedMaps,
      total: formattedMaps.length,
      fromDatabase: true,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('获取地图数据时出错:', error);
    
    return json({
      error: 'Failed to fetch map data',
      message: error instanceof Error ? error.message : '获取地图数据失败'
    }, { status: 500 });
  }
};