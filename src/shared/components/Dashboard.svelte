<script lang="ts">
  import { getAvailableTools } from '../../tools/registry';
  import { navigate, getToolPath } from '../router';
  import type { User } from '../auth/auth';
  import type { Tool } from '../../tools/registry';

  export let user: User;

  $: availableTools = getAvailableTools(user);
  $: recentTools = availableTools.slice(0, 3); // 显示前3个工具作为推荐

  function handleToolClick(tool: Tool) {
    navigate(getToolPath(tool.id));
  }

  // 获取用户统计信息
  function getUserStats() {
    const totalTools = availableTools.length;
    const gameTools = availableTools.filter(tool => tool.category === 'game').length;
    const utilityTools = availableTools.filter(tool => tool.category === 'utility').length;
    const analyticsTools = availableTools.filter(tool => tool.category === 'analytics').length;
    
    return { totalTools, gameTools, utilityTools, analyticsTools };
  }

  $: stats = getUserStats();
</script>

<div class="space-y-6">
  <!-- 欢迎横幅 -->
  <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold mb-2">
          欢迎回来，{user.username}！
          {#if user.isAdmin}<span class="text-yellow-300">👑</span>{/if}
        </h1>
        <p class="text-blue-100 text-lg">
          DDNet 工具集为你提供了 {stats.totalTools} 个实用工具，让你的游戏体验更上一层楼。
        </p>
      </div>
      <div class="hidden md:block text-6xl opacity-20">
        🛠️
      </div>
    </div>
  </div>

  <!-- 统计卡片 -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <div class="bg-gray-800 rounded-xl p-4">
      <div class="flex items-center gap-3">
        <div class="text-2xl">🎮</div>
        <div>
          <div class="text-2xl font-bold text-white">{stats.gameTools}</div>
          <div class="text-sm text-gray-400">游戏工具</div>
        </div>
      </div>
    </div>
    
    <div class="bg-gray-800 rounded-xl p-4">
      <div class="flex items-center gap-3">
        <div class="text-2xl">🔧</div>
        <div>
          <div class="text-2xl font-bold text-white">{stats.utilityTools}</div>
          <div class="text-sm text-gray-400">实用工具</div>
        </div>
      </div>
    </div>
    
    <div class="bg-gray-800 rounded-xl p-4">
      <div class="flex items-center gap-3">
        <div class="text-2xl">📊</div>
        <div>
          <div class="text-2xl font-bold text-white">{stats.analyticsTools}</div>
          <div class="text-sm text-gray-400">数据分析</div>
        </div>
      </div>
    </div>
    
    <div class="bg-gray-800 rounded-xl p-4">
      <div class="flex items-center gap-3">
        <div class="text-2xl">⭐</div>
        <div>
          <div class="text-2xl font-bold text-white">{stats.totalTools}</div>
          <div class="text-sm text-gray-400">总工具数</div>
        </div>
      </div>
    </div>
  </div>

  <!-- 推荐工具 -->
  <div class="bg-gray-800 rounded-xl p-6">
    <h2 class="text-xl font-bold text-white mb-4">🌟 推荐工具</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each recentTools as tool (tool.id)}
        <button
          class="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-all hover:scale-105"
          on:click={() => handleToolClick(tool)}
        >
          <div class="flex items-start gap-4">
            <div class="text-3xl">{tool.icon}</div>
            <div class="flex-1 min-w-0">
              <h3 class="font-medium text-white mb-1">{tool.name}</h3>
              <p class="text-sm text-gray-400 line-clamp-2">{tool.description}</p>
              <div class="mt-2">
                <span class="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                  {tool.category === 'game' ? '🎮 游戏' : tool.category === 'utility' ? '🔧 工具' : '📊 分析'}
                </span>
              </div>
            </div>
          </div>
        </button>
      {/each}
    </div>
  </div>

  <!-- 快速开始指南 -->
  <div class="bg-gray-800 rounded-xl p-6">
    <h2 class="text-xl font-bold text-white mb-4">🚀 快速开始</h2>
    <div class="space-y-4">
      <div class="flex items-start gap-3">
        <div class="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">1</div>
        <div>
          <h3 class="font-medium text-white">选择工具</h3>
          <p class="text-sm text-gray-400">从上方导航中选择你需要的工具</p>
        </div>
      </div>
      
      <div class="flex items-start gap-3">
        <div class="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">2</div>
        <div>
          <h3 class="font-medium text-white">配置设置</h3>
          <p class="text-sm text-gray-400">根据需要配置工具的相关参数</p>
        </div>
      </div>
      
      <div class="flex items-start gap-3">
        <div class="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">3</div>
        <div>
          <h3 class="font-medium text-white">开始使用</h3>
          <p class="text-sm text-gray-400">享受工具带来的便利和效率提升</p>
        </div>
      </div>
    </div>
  </div>

  <!-- 系统信息 -->
  <div class="bg-gray-800 rounded-xl p-6">
    <h2 class="text-xl font-bold text-white mb-4">ℹ️ 系统信息</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      <div>
        <span class="text-gray-400">注册时间：</span>
        <span class="text-white">{new Date(user.createdAt).toLocaleString('zh-CN')}</span>
      </div>
      <div>
        <span class="text-gray-400">用户角色：</span>
        <span class="text-white">{user.isAdmin ? '管理员' : '普通用户'}</span>
      </div>
      <div>
        <span class="text-gray-400">邮箱地址：</span>
        <span class="text-white">{user.email}</span>
      </div>
      <div>
        <span class="text-gray-400">用户ID：</span>
        <span class="text-white font-mono text-xs">{user.id.slice(0, 16)}...</span>
      </div>
    </div>
  </div>
</div>