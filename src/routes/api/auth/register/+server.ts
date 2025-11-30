import { json, type RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/schema';
import { hashPassword } from '$lib/server/auth';
import { isRegistrationDisabled } from '$lib/server/settings';
import { eq, count } from 'drizzle-orm';

// 用户名验证函数
function validateUsername(username: string): { valid: boolean; message?: string } {
  const trimmedUsername = username.trim();
  
  // 检查长度
  if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
    return { valid: false, message: '用户名长度必须在3-20个字符之间' };
  }
  
  // 检查是否包含空格
  if (trimmedUsername.includes(' ')) {
    return { valid: false, message: '用户名不能包含空格' };
  }
  
  // 检查字符（只允许字母、数字、下划线、连字符）
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
    return { valid: false, message: '用户名只能包含字母、数字、下划线和连字符' };
  }
  
  // 检查是否以字母或数字开头
  if (!/^[a-zA-Z0-9]/.test(trimmedUsername)) {
    return { valid: false, message: '用户名必须以字母或数字开头' };
  }
  
  return { valid: true };
}

export const POST = async ({ request }: RequestEvent) => {
  try {
    // 检查是否已有用户存在
    const userCountResult = await db.select({ count: count() }).from(users);
    const hasUsers = userCountResult[0].count > 0;
    
    // 检查注册是否被禁用（如果已有用户的话）
    if (hasUsers && await isRegistrationDisabled()) {
      return json({ 
        success: false, 
        message: '注册功能已被管理员关闭' 
      }, { status: 403 });
    }

    const { username, password } = await request.json();

    // 验证输入
    if (!username?.trim() || !password?.trim()) {
      return json({ success: false, message: '用户名和密码都是必需的' }, { status: 400 });
    }

    // 验证用户名格式
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return json({ success: false, message: usernameValidation.message }, { status: 400 });
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