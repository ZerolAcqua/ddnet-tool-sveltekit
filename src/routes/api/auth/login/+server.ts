import { json, type RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, sessions } from '$lib/server/schema';
import { verifyPassword, generateSessionToken, createSession } from '$lib/server/auth';
import { eq } from 'drizzle-orm';

export const POST = async ({ request, cookies }: RequestEvent) => {
  try {
    const { username, password } = await request.json();

    if (!username?.trim() || !password?.trim()) {
      return json({ success: false, message: '用户名和密码不能为空' }, { status: 400 });
    }

    // 查找用户
    const userResult = await db.select().from(users).where(eq(users.username, username.trim())).limit(1);
    
    if (userResult.length === 0) {
      return json({ success: false, message: '用户名或密码错误' }, { status: 401 });
    }

    const user = userResult[0];

    // 验证密码
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return json({ success: false, message: '用户名或密码错误' }, { status: 401 });
    }

    // 创建会话
    const sessionToken = generateSessionToken();
    const session = await createSession(sessionToken, user.id);

    // 设置 cookie
    cookies.set('session', sessionToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30 // 30 天
    });

    return json({ 
      success: true, 
      message: '登录成功', 
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('登录失败:', error);
    return json({ success: false, message: '登录失败，请稍后重试' }, { status: 500 });
  }
};