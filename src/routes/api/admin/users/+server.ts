import { json, type RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/schema';
import { verifySession } from '$lib/server/auth';

export const GET = async ({ cookies }: RequestEvent) => {
  try {
    const sessionToken = cookies.get('session');
    if (!sessionToken) {
      return json({ success: false, message: '请先登录' }, { status: 401 });
    }

    const user = await verifySession(sessionToken);
    if (!user || !user.isAdmin) {
      return json({ success: false, message: '权限不足' }, { status: 403 });
    }

    const allUsers = await db.select({
      id: users.id,
      username: users.username,
      isAdmin: users.isAdmin,
      createdAt: users.createdAt,
    }).from(users)
      .orderBy(users.createdAt);

    return json({ 
      success: true, 
      users: allUsers
    });

  } catch (error) {
    console.error('获取用户列表失败:', error);
    return json({ success: false, message: '获取用户列表失败，请稍后重试' }, { status: 500 });
  }
};