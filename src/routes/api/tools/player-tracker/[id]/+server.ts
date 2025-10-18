import { json, type RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { trackedPlayers } from '$lib/server/schema';
import { verifySession } from '$lib/server/auth';
import { eq, and } from 'drizzle-orm';

// 更新追踪玩家设置
export const PATCH = async ({ request, cookies, params }: RequestEvent) => {
  try {
    const sessionToken = cookies.get('session');
    if (!sessionToken) {
      return json({ success: false, message: '请先登录' }, { status: 401 });
    }

    const user = await verifySession(sessionToken);
    if (!user) {
      return json({ success: false, message: '会话已过期，请重新登录' }, { status: 401 });
    }

    const playerId = params.id;
    if (!playerId) {
      return json({ success: false, message: '缺少玩家ID' }, { status: 400 });
    }

    const { isActive, notificationEnabled, playerName } = await request.json();

    // 验证玩家是否属于当前用户
    const player = await db.select().from(trackedPlayers)
      .where(
        and(
          eq(trackedPlayers.id, playerId),
          eq(trackedPlayers.userId, user.id)
        )
      ).limit(1);

    if (player.length === 0) {
      return json({ success: false, message: '玩家不存在或无权限' }, { status: 404 });
    }

    // 如果更新玩家名，需要检查重复
    if (playerName && typeof playerName === 'string') {
      const trimmedName = playerName.trim();
      if (trimmedName !== player[0].playerName) {
        // 检查是否已存在同名玩家
        const existingPlayer = await db.select().from(trackedPlayers)
          .where(
            and(
              eq(trackedPlayers.playerName, trimmedName),
              eq(trackedPlayers.userId, user.id)
            )
          ).limit(1);

        if (existingPlayer.length > 0) {
          return json({ success: false, message: '该玩家名已存在' }, { status: 400 });
        }
      }
    }

    // 更新设置
    const updates: any = {};
    if (typeof isActive === 'boolean') updates.isActive = isActive;
    if (typeof notificationEnabled === 'boolean') updates.notificationEnabled = notificationEnabled;
    if (playerName && typeof playerName === 'string') {
      const trimmedName = playerName.trim();
      if (trimmedName && trimmedName !== player[0].playerName) {
        updates.playerName = trimmedName;
      }
    }

    if (Object.keys(updates).length === 0) {
      return json({ success: false, message: '没有有效的更新数据' }, { status: 400 });
    }

    const updatedPlayer = await db.update(trackedPlayers)
      .set(updates)
      .where(eq(trackedPlayers.id, playerId))
      .returning();

    return json({ 
      success: true, 
      message: '设置更新成功',
      player: {
        id: updatedPlayer[0].id,
        playerName: updatedPlayer[0].playerName,
        isActive: updatedPlayer[0].isActive,
        notificationEnabled: updatedPlayer[0].notificationEnabled,
        createdAt: updatedPlayer[0].createdAt
      }
    });

  } catch (error) {
    console.error('更新追踪玩家失败:', error);
    return json({ success: false, message: '更新失败，请稍后重试' }, { status: 500 });
  }
};

// 删除追踪玩家
export const DELETE = async ({ cookies, params }: RequestEvent) => {
  try {
    const sessionToken = cookies.get('session');
    if (!sessionToken) {
      return json({ success: false, message: '请先登录' }, { status: 401 });
    }

    const user = await verifySession(sessionToken);
    if (!user) {
      return json({ success: false, message: '会话已过期，请重新登录' }, { status: 401 });
    }

    const playerId = params.id;
    if (!playerId) {
      return json({ success: false, message: '缺少玩家ID' }, { status: 400 });
    }

    // 验证并删除
    const result = await db.delete(trackedPlayers)
      .where(
        and(
          eq(trackedPlayers.id, playerId),
          eq(trackedPlayers.userId, user.id)
        )
      ).returning();

    if (result.length === 0) {
      return json({ success: false, message: '玩家不存在或无权限' }, { status: 404 });
    }

    return json({ 
      success: true, 
      message: '玩家移除成功'
    });

  } catch (error) {
    console.error('删除追踪玩家失败:', error);
    return json({ success: false, message: '删除失败，请稍后重试' }, { status: 500 });
  }
};