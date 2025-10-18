<script lang="ts">
  import Navigation from '$lib/components/Navigation.svelte';
  
  const tools = [
    {
      id: 'player-tracker',
      name: '玩家追踪器',
      description: '实时追踪 DDNet 玩家在线状态，支持上线通知和服务器信息查看',
      icon: '🎯',
      available: true,
      requireAuth: true
    },
    {
      id: 'server-browser',
      name: '服务器浏览器',
      description: '浏览所有 DDNet 服务器状态和玩家信息',
      icon: '🌐',
      available: false,
      requireAuth: false
    },
    {
      id: 'map-tracker',
      name: '地图进度',
      description: '查看和追踪你的地图完成进度',
      icon: '🗺️',
      available: false,
      requireAuth: true
    }
  ];
</script>

<svelte:head>
  <title>工具列表 - DDNet 工具集</title>
</svelte:head>

<Navigation />

<div class="container mx-auto max-w-7xl px-6 py-8">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-white mb-4">工具列表</h1>
    <p class="text-gray-300">选择你需要的 DDNet 工具</p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each tools as tool}
      <div class="card">
        <div class="flex items-start justify-between mb-4">
          <div class="text-3xl">{tool.icon}</div>
          <div class="flex items-center space-x-2">
            {#if tool.requireAuth}
              <span class="text-xs px-2 py-1 bg-blue-900/50 text-blue-300 rounded">需要登录</span>
            {/if}
            {#if tool.available}
              <span class="text-xs px-2 py-1 bg-green-900/50 text-green-300 rounded">可用</span>
            {:else}
              <span class="text-xs px-2 py-1 bg-gray-700 text-gray-400 rounded">即将推出</span>
            {/if}
          </div>
        </div>

        <h3 class="text-xl font-semibold mb-2">{tool.name}</h3>
        <p class="text-gray-400 mb-4">{tool.description}</p>

        <div class="mt-auto">
          {#if tool.available}
            <a href="/tools/{tool.id}" class="btn-primary inline-block w-full text-center">
              使用工具
            </a>
          {:else}
            <button disabled class="btn-secondary w-full opacity-50 cursor-not-allowed">
              即将推出
            </button>
          {/if}
        </div>
      </div>
    {/each}
  </div>

  <!-- 返回首页 -->
  <div class="mt-8 text-center">
    <a href="/" class="text-gray-400 hover:text-white transition-colors">
      ← 返回首页
    </a>
  </div>
</div>