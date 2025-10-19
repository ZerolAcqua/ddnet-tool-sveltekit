import { json, type RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/schema';
import { hashPassword } from '$lib/server/auth';
import { eq, count } from 'drizzle-orm';

export const POST = async ({ request }: RequestEvent) => {
  try {
    const { username, password } = await request.json();

    // 验证输入
    if (!username?.trim() || !password?.trim()) {
      return json({ success: false, message: '用户名和密码都是必需的' }, { status: 400 });
    }

    if (password.length < 6) {
      return json({ success: false, message: '密码长度至少6位' }, { status: 400 });
    }

    // 检查用户名是否已存在
    const existingUser = await db.select().from(users).where(eq(users.username, username.trim())).limit(1);
    if (existingUser.length > 0) {
      return json({ success: false, message: '用户名已存在' }, { status: 409 });
    }

    // 检查是否为第一个用户（设为管理员）
    const userCountResult = await db.select({ count: count() }).from(users);
    const isFirstUser = userCountResult[0].count === 0;

    // 创建用户
    const passwordHash = await hashPassword(password);
    const newUser = await db.insert(users).values({
      username: username.trim(),
      passwordHash,
      isAdmin: isFirstUser,
    }).returning({
      id: users.id,
      username: users.username,
      isAdmin: users.isAdmin,
      createdAt: users.createdAt,
    });

    return json({ 
      success: true, 
      message: '注册成功', 
      user: newUser[0]
    });

  } catch (error) {
    console.error('注册失败:', error);
    return json({ success: false, message: '注册失败，请稍后重试' }, { status: 500 });
  }
};