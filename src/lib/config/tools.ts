// 工具配置文件
export interface Tool {
  id: string;
  name: string;
  description: string;
  available: boolean;
  requireAuth: boolean;
  hideNotAuth: boolean;
}

export const tools: Tool[] = [
  {
    id: 'player-tracker',
    name: '玩家追踪器',
    description: '实时追踪 DDNet 玩家在线状态，支持上线通知和服务器信息查看',
    available: true,
    requireAuth: true,
    hideNotAuth: false
  },
  {
    id: 'map-guide',
    name: '地图攻略',
    description: '浏览 DDNet 地图信息和攻略视频，支持按难度筛选和搜索',
    available: true,
    requireAuth: false,
    hideNotAuth: false
  },
  {
    id: 'server-browser',
    name: '服务器浏览器',
    description: '浏览所有 DDNet 服务器状态和玩家信息',
    available: false,
    requireAuth: true,
    hideNotAuth: true
  }
];

// 工具统计辅助函数
export function getToolStats() {
  return {
    total: tools.length,
    available: tools.filter(tool => tool.available).length,
    requireAuth: tools.filter(tool => tool.requireAuth).length,
    public: tools.filter(tool => !tool.requireAuth).length
  };
}