import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface User {
  id: string;
  username: string;
  isAdmin: boolean;
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// 创建认证状态 store - SSR 安全的初始状态
export const authState = writable<AuthState>({
  user: null,
  isAuthenticated: false,
  isLoading: browser // 只有在浏览器中才显示加载状态
});

// 初始化认证状态
export async function initAuth() {
  if (!browser) return;
  
  try {
    const response = await fetch('/api/auth/me');
    const data = await response.json();
    
    authState.set({
      user: data.user,
      isAuthenticated: data.isAuthenticated,
      isLoading: false
    });
  } catch (error) {
    console.error('获取用户状态失败:', error);
    authState.set({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
  }
}

// 登出
export async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    authState.set({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
  } catch (error) {
    console.error('登出失败:', error);
  }
}

// 更新用户信息
export function updateUser(user: User) {
  authState.update(state => ({
    ...state,
    user,
    isAuthenticated: true
  }));
}