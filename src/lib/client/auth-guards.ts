import { redirect } from '@sveltejs/kit';
import type { User } from '$lib/stores/auth';

// 通用的认证检查函数
export async function requireAuth(fetch: typeof globalThis.fetch, url: URL): Promise<User> {
  try {
    const response = await fetch('/api/auth/me');
    const data = await response.json();

    if (!data.isAuthenticated) {
      const redirectTo = url.pathname + url.search;
      throw redirect(302, `/login?redirectTo=${encodeURIComponent(redirectTo)}`);
    }

    return data.user;
  } catch (error) {
    if (error instanceof Response && error.status === 302) {
      throw error; // 重新抛出重定向
    }

    // 其他错误，重定向到登录页
    const redirectTo = url.pathname + url.search;
    throw redirect(302, `/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }
}

// 管理员权限检查
export async function requireAdmin(fetch: typeof globalThis.fetch): Promise<User> {
  const user = await requireAuth(fetch, new URL('/admin', 'http://localhost'));

  if (!user.isAdmin) {
    throw redirect(302, '/');
  }

  return user;
}

// 创建需要认证的页面加载器
export function createAuthLoader() {
  return async ({ fetch, url }: { fetch: typeof globalThis.fetch; url: URL }) => {
    const user = await requireAuth(fetch, url);
    return { user };
  };
}

// 创建需要管理员权限的页面加载器
export function createAdminLoader() {
  return async ({ fetch }: { fetch: typeof globalThis.fetch }) => {
    const user = await requireAdmin(fetch);
    return { user };
  };
}
