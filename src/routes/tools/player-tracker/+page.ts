import type { PageLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageLoad = async ({ url, fetch }) => {
  // 检查用户认证状态
  try {
    const response = await fetch('/api/auth/me');
    const data = await response.json();
    
    if (!data.isAuthenticated) {
      const redirectTo = url.pathname;
      throw redirect(302, `/login?redirectTo=${encodeURIComponent(redirectTo)}`);
    }
    
    return {
      user: data.user
    };
  } catch (error) {
    if (error instanceof Response && error.status === 302) {
      throw error; // 重新抛出重定向
    }
    
    // 其他错误，重定向到登录页
    const redirectTo = url.pathname;
    throw redirect(302, `/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }
};