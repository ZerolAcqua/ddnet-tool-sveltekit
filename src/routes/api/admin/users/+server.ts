import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/schema';
import { withAdminAuth } from '$lib/server/middleware';

export const GET = withAdminAuth(async () => {
  try {
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
});