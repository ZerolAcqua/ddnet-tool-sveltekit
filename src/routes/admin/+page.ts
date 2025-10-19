import type { PageLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageLoad = async ({ fetch }) => {
  // 检查用户认证状态和管理员权限
  try {
    const response = await fetch('/api/auth/me');
    const data = await response.json();
    
    if (!data.isAuthenticated || !data.user?.isAdmin) {
      throw redirect(302, '/');
    }
    
    return {
      user: data.user
    };
  } catch (error) {
    if (error instanceof Response && error.status === 302) {
      throw error; // 重新抛出重定向
    }
    
    // 其他错误，重定向到首页
    throw redirect(302, '/');
  }
};