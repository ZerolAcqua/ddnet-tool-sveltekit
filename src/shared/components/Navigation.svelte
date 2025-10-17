<script lang="ts">
  import { getAvailableTools, getToolsByCategory } from '../../tools/registry';
  import { navigate, currentRoute, getToolPath } from '../router';
  import type { User } from '../auth/auth';
  import type { Tool } from '../../tools/registry';

  export let user: User;

  $: availableTools = getAvailableTools(user);
  $: gameTools = getToolsByCategory('game').filter((tool: Tool) => availableTools.includes(tool));
  $: utilityTools = getToolsByCategory('utility').filter((tool: Tool) => availableTools.includes(tool));
  $: analyticsTools = getToolsByCategory('analytics').filter((tool: Tool) => availableTools.includes(tool));

  function handleToolClick(tool: Tool) {
    navigate(getToolPath(tool.id));
  }

  function handleDashboardClick() {
    navigate('/');
  }

  // 检查当前路由是否为工具路由
  $: currentToolId = $currentRoute.name === 'tool' ? $currentRoute.path.split('/')[2] : null;
</script>

<nav class="bg-gray-800 rounded-xl p-6 mb-6">
  <div class="flex items-center justify-between mb-6">
    <button
      class="flex items-center gap-3 text-white hover:text-blue-400 transition-colors"
      on:click={handleDashboardClick}
    >
      <div class="text-2xl">🛠️</div>
      <div>
        <h1 class="text-2xl font-bold">DDNet 工具集</h1>
        <p class="text-sm text-gray-400">专为 DDNet 玩家打造的实用工具平台</p>
      </div>
    </button>
    
    <div class="text-sm text-gray-400">
      欢迎，{user.username} {#if user.isAdmin}<span class="text-purple-400">👑</span>{/if}
    </div>
  </div>

  <!-- 工具分类导航 -->
  <div class="space-y-4">
    <!-- 游戏工具 -->
    {#if gameTools.length > 0}
      <div>
        <h3 class="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">🎮 游戏工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {#each gameTools as tool (tool.id)}
            <button
              class="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors border-2 {currentToolId === tool.id ? 'border-blue-500 bg-blue-900/30' : 'border-transparent'}"
              on:click={() => handleToolClick(tool)}
            >
              <div class="flex items-start gap-3">
                <div class="text-2xl">{tool.icon}</div>
                <div class="flex-1 min-w-0">
                  <h4 class="font-medium text-white text-sm truncate">{tool.name}</h4>
                  <p class="text-xs text-gray-400 mt-1 line-clamp-2">{tool.description}</p>
                </div>
              </div>
            </button>
          {/each}
        </div>
      </div>
    {/if}

    <!-- 实用工具 -->
    {#if utilityTools.length > 0}
      <div>
        <h3 class="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">🔧 实用工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {#each utilityTools as tool (tool.id)}
            <button
              class="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors border-2 {currentToolId === tool.id ? 'border-blue-500 bg-blue-900/30' : 'border-transparent'}"
              on:click={() => handleToolClick(tool)}
            >
              <div class="flex items-start gap-3">
                <div class="text-2xl">{tool.icon}</div>
                <div class="flex-1 min-w-0">
                  <h4 class="font-medium text-white text-sm truncate">{tool.name}</h4>
                  <p class="text-xs text-gray-400 mt-1 line-clamp-2">{tool.description}</p>
                </div>
              </div>
            </button>
          {/each}
        </div>
      </div>
    {/if}

    <!-- 数据分析 -->
    {#if analyticsTools.length > 0}
      <div>
        <h3 class="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">📊 数据分析</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {#each analyticsTools as tool (tool.id)}
            <button
              class="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors border-2 {currentToolId === tool.id ? 'border-blue-500 bg-blue-900/30' : 'border-transparent'}"
              on:click={() => handleToolClick(tool)}
            >
              <div class="flex items-start gap-3">
                <div class="text-2xl">{tool.icon}</div>
                <div class="flex-1 min-w-0">
                  <h4 class="font-medium text-white text-sm truncate">{tool.name}</h4>
                  <p class="text-xs text-gray-400 mt-1 line-clamp-2">{tool.description}</p>
                </div>
              </div>
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <!-- 快速统计 -->
  <div class="mt-6 pt-4 border-t border-gray-600">
    <div class="flex items-center justify-between text-sm text-gray-400">
      <span>可用工具: {availableTools.length} 个</span>
      {#if currentToolId}
        <span>当前使用: {availableTools.find((t: Tool) => t.id === currentToolId)?.name || '未知'}</span>
      {/if}
    </div>
  </div>
</nav>