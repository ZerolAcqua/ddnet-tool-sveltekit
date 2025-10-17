// 简单的前端路由系统
import { writable } from 'svelte/store';

export interface Route {
  path: string;
  name: string;
  component?: any;
  toolId?: string;
  requireAuth?: boolean;
}

// 路由状态
export const currentRoute = writable<Route>({ path: '/', name: 'dashboard' });
export const routeParams = writable<Record<string, string>>({});

// 路由定义
export const routes: Route[] = [
  { path: '/', name: 'dashboard', requireAuth: true },
  { path: '/profile', name: 'profile', requireAuth: true },
  { path: '/admin', name: 'admin', requireAuth: true },
  { path: '/tool/:toolId', name: 'tool', requireAuth: true },
  { path: '/login', name: 'login', requireAuth: false }
];

// 路由历史
let routeHistory: string[] = [];

// 解析路径参数
function parseParams(pattern: string, path: string): Record<string, string> {
  const params: Record<string, string> = {};
  const patternParts = pattern.split('/');
  const pathParts = path.split('/');

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    if (patternPart.startsWith(':')) {
      const paramName = patternPart.slice(1);
      params[paramName] = pathPart || '';
    }
  }

  return params;
}

// 匹配路由
function matchRoute(path: string): Route | null {
  for (const route of routes) {
    const routePattern = route.path;
    
    // 完全匹配
    if (routePattern === path) {
      return route;
    }
    
    // 参数匹配
    if (routePattern.includes(':')) {
      const patternParts = routePattern.split('/');
      const pathParts = path.split('/');
      
      if (patternParts.length === pathParts.length) {
        let isMatch = true;
        for (let i = 0; i < patternParts.length; i++) {
          const patternPart = patternParts[i];
          const pathPart = pathParts[i];
          
          if (!patternPart.startsWith(':') && patternPart !== pathPart) {
            isMatch = false;
            break;
          }
        }
        
        if (isMatch) {
          return route;
        }
      }
    }
  }
  
  return null;
}

// 导航到指定路径
export function navigate(path: string, replace: boolean = false) {
  const route = matchRoute(path);
  
  if (!route) {
    console.warn('Route not found:', path);
    return;
  }

  // 解析参数
  const params = parseParams(route.path, path);
  
  // 更新路由状态
  currentRoute.set({ ...route, path });
  routeParams.set(params);
  
  // 更新浏览器历史
  if (replace) {
    window.history.replaceState(null, '', path);
  } else {
    window.history.pushState(null, '', path);
    routeHistory.push(path);
  }
}

// 后退
export function goBack() {
  if (routeHistory.length > 1) {
    routeHistory.pop(); // 移除当前路径
    const previousPath = routeHistory[routeHistory.length - 1] || '/';
    navigate(previousPath, true);
  } else {
    navigate('/', true);
  }
}

// 获取当前路径
export function getCurrentPath(): string {
  return window.location.pathname;
}

// 初始化路由
export function initRouter() {
  // 处理浏览器前进后退
  window.addEventListener('popstate', () => {
    const path = getCurrentPath();
    const route = matchRoute(path);
    
    if (route) {
      const params = parseParams(route.path, path);
      currentRoute.set({ ...route, path });
      routeParams.set(params);
    }
  });
  
  // 初始路由
  const initialPath = getCurrentPath();
  navigate(initialPath, true);
}

// 路由守卫 - 检查认证状态
export function checkAuthGuard(route: Route, isAuthenticated: boolean): boolean {
  if (route.requireAuth && !isAuthenticated) {
    navigate('/login', true);
    return false;
  }
  
  if (!route.requireAuth && isAuthenticated && route.name === 'login') {
    navigate('/', true);
    return false;
  }
  
  return true;
}

// 生成工具路径
export function getToolPath(toolId: string): string {
  return `/tool/${toolId}`;
}

// 检查是否为当前路由
export function isCurrentRoute(routeName: string, params?: Record<string, string>): boolean {
  let isMatch = false;
  
  currentRoute.subscribe(route => {
    isMatch = route.name === routeName;
  })();
  
  if (isMatch && params) {
    routeParams.subscribe(currentParams => {
      isMatch = Object.keys(params).every(key => currentParams[key] === params[key]);
    })();
  }
  
  return isMatch;
}