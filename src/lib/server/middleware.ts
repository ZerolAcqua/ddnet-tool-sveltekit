import { json, type RequestEvent } from '@sveltejs/kit';
import { verifySession } from './auth';
import type { User } from './schema';

// 认证中间件类型定义
export interface AuthenticatedRequest extends RequestEvent {
  user: User;
}

// 基础会话验证
export async function requireAuth(event: RequestEvent): Promise<User | Response> {
  const sessionToken = event.cookies.get('session');

  if (!sessionToken) {
    return json({ success: false, message: '请先登录' }, { status: 401 });
  }

  const user = await verifySession(sessionToken);
  if (!user) {
    // 清除无效 cookie
    event.cookies.delete('session', { path: '/' });
    return json({ success: false, message: '会话已过期，请重新登录' }, { status: 401 });
  }

  return user;
}

// 管理员权限验证
export async function requireAdmin(event: RequestEvent): Promise<User | Response> {
  const userOrResponse = await requireAuth(event);

  if (userOrResponse instanceof Response) {
    return userOrResponse; // 返回认证错误
  }

  if (!userOrResponse.isAdmin) {
    return json({ success: false, message: '权限不足' }, { status: 403 });
  }

  return userOrResponse;
}

// 可选的认证检查（用于设置接口等）
export async function optionalAuth(event: RequestEvent): Promise<User | null> {
  const sessionToken = event.cookies.get('session');

  if (!sessionToken) {
    return null;
  }

  return await verifySession(sessionToken);
}

// 通用的 API 包装器
export function withAuth<T>(handler: (event: AuthenticatedRequest) => Promise<T>) {
  return async (event: RequestEvent): Promise<T> => {
    const userOrResponse = await requireAuth(event);

    if (userOrResponse instanceof Response) {
      return userOrResponse as T;
    }

    // 将用户信息附加到事件对象
    const authenticatedEvent = { ...event, user: userOrResponse } as AuthenticatedRequest;
    return handler(authenticatedEvent);
  };
}

// 管理员权限包装器
export function withAdminAuth<T>(handler: (event: AuthenticatedRequest) => Promise<T>) {
  return async (event: RequestEvent): Promise<T> => {
    const userOrResponse = await requireAdmin(event);

    if (userOrResponse instanceof Response) {
      return userOrResponse as T;
    }

    const authenticatedEvent = { ...event, user: userOrResponse } as AuthenticatedRequest;
    return handler(authenticatedEvent);
  };
}
