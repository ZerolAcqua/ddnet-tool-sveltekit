// 工具路由和管理系统
import type { User } from '../shared/auth/auth';

export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'game' | 'utility' | 'analytics';
  component: any; // Svelte 组件
  requiredPermissions?: string[];
  isActive?: boolean;
}

// 动态导入工具组件
const PlayerTrackerTool = () => import('./player-tracker/PlayerTrackerTool.svelte');

// 工具注册表
export const toolRegistry: Tool[] = [
  {
    id: 'player-tracker',
    name: 'DDNet 玩家追踪器',
    description: '实时追踪 DDNet 玩家在线状态，支持通知和服务器信息',
    icon: '🎯',
    category: 'game',
    component: PlayerTrackerTool,
    isActive: true
  },
  // 后续可以添加更多工具
  // {
  //   id: 'server-monitor',
  //   name: 'DDNet 服务器监控',
  //   description: '监控 DDNet 服务器状态和在线人数',
  //   icon: '📊', 
  //   category: 'game',
  //   component: () => import('./server-monitor/ServerMonitorTool.svelte')
  // },
  // {
  //   id: 'map-analyzer', 
  //   name: '地图分析工具',
  //   description: '分析 DDNet 地图数据和完成记录',
  //   icon: '🗺️',
  //   category: 'analytics',
  //   component: () => import('./map-analyzer/MapAnalyzerTool.svelte')
  // }
];

// 根据用户权限过滤工具
export function getAvailableTools(user: User | null): Tool[] {
  return toolRegistry.filter(tool => {
    if (!tool.isActive) return false;
    
    // 如果工具需要特定权限
    if (tool.requiredPermissions && tool.requiredPermissions.length > 0) {
      if (!user) return false;
      
      // 管理员可以访问所有工具
      if (user.isAdmin) return true;
      
      // 检查用户是否有所需权限
      // 这里可以扩展更复杂的权限检查逻辑
      return true;
    }
    
    return true;
  });
}

// 根据ID获取工具
export function getToolById(toolId: string): Tool | undefined {
  return toolRegistry.find(tool => tool.id === toolId);
}

// 根据分类获取工具
export function getToolsByCategory(category: string): Tool[] {
  return toolRegistry.filter(tool => tool.category === category && tool.isActive);
}