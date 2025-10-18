import { json, type RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { trackedPlayers, users } from '$lib/server/schema';
import { verifySession } from '$lib/server/auth';
import { eq, and } from 'drizzle-orm';

// 获取用户的追踪玩家列表
export const GET = async ({ cookies }: RequestEvent) => {
  try {
    const sessionToken = cookies.get('session');
    if (!sessionToken) {
      return json({ success: false, message: '请先登录' }, { status: 401 });
    }

    const user = await verifySession(sessionToken);
    if (!user) {
      return json({ success: false, message: '会话已过期，请重新登录' }, { status: 401 });
    }

    const players = await db.select().from(trackedPlayers)
      .where(eq(trackedPlayers.userId, user.id))
      .orderBy(trackedPlayers.createdAt);

    return json({ 
      success: true, 
      players: players.map(p => ({
        id: p.id,
        playerName: p.playerName,
        isActive: p.isActive,
        notificationEnabled: p.notificationEnabled,
        createdAt: p.createdAt
      }))
    });

  } catch (error) {
    console.error('获取追踪玩家列表失败:', error);
    return json({ success: false, message: '获取列表失败，请稍后重试' }, { status: 500 });
  }
};

// 添加追踪玩家
export const POST = async ({ request, cookies }: RequestEvent) => {
  try {
    const sessionToken = cookies.get('session');
    if (!sessionToken) {
      return json({ success: false, message: '请先登录' }, { status: 401 });
    }

    const user = await verifySession(sessionToken);
    if (!user) {
      return json({ success: false, message: '会话已过期，请重新登录' }, { status: 401 });
    }

    const { playerName } = await request.json();

    if (!playerName?.trim()) {
      return json({ success: false, message: '玩家名不能为空' }, { status: 400 });
    }

    // 检查是否已存在
    const existing = await db.select().from(trackedPlayers)
      .where(
        and(
          eq(trackedPlayers.userId, user.id),
          eq(trackedPlayers.playerName, playerName.trim())
        )
      ).limit(1);

    if (existing.length > 0) {
      return json({ success: false, message: '该玩家已在追踪列表中' }, { status: 409 });
    }

    // 添加玩家
    const newPlayer = await db.insert(trackedPlayers).values({
      userId: user.id,
      playerName: playerName.trim(),
    }).returning();

    return json({ 
      success: true, 
      message: '玩家添加成功',
      player: {
        id: newPlayer[0].id,
        playerName: newPlayer[0].playerName,
        isActive: newPlayer[0].isActive,
        notificationEnabled: newPlayer[0].notificationEnabled,
        createdAt: newPlayer[0].createdAt
      }
    });

  } catch (error) {
    console.error('添加追踪玩家失败:', error);
    return json({ success: false, message: '添加失败，请稍后重试' }, { status: 500 });
  }
};

// 清空所有追踪玩家
export const DELETE = async ({ cookies }: RequestEvent) => {
  try {
    const sessionToken = cookies.get('session');
    if (!sessionToken) {
      return json({ success: false, message: '请先登录' }, { status: 401 });
    }

    const user = await verifySession(sessionToken);
    if (!user) {
      return json({ success: false, message: '会话已过期，请重新登录' }, { status: 401 });
    }

    // 删除用户的所有追踪玩家
    const result = await db.delete(trackedPlayers)
      .where(eq(trackedPlayers.userId, user.id))
      .returning();

    return json({ 
      success: true, 
      message: `已清空追踪列表，共移除 ${result.length} 个玩家`
    });

  } catch (error) {
    console.error('清空追踪玩家列表失败:', error);
    return json({ success: false, message: '清空失败，请稍后重试' }, { status: 500 });
  }
};