<script lang="ts">
  import Navigation from '$lib/components/Navigation.svelte';
  import PlayerTracker from '$lib/components/PlayerTracker.svelte';
  
  // 页面数据由 +page.ts 加载函数提供
  export const data = undefined;
</script>

<svelte:head>
  <title>玩家追踪器 - DDNet 工具集</title>
  <meta name="description" content="实时追踪 DDNet 玩家在线状态，支持上线通知和服务器信息查看" />
</svelte:head>

<Navigation />

<div class="container mx-auto max-w-7xl px-6 py-8">
  <!-- 页面标题 -->
  <div class="card mb-6">
    <div>
      <h1 class="text-3xl font-bold text-white mb-2">DDNet 玩家追踪器</h1>
      <p class="text-gray-300">实时追踪你关心的 DDNet 玩家在线状态，支持上线通知和服务器信息查看。</p>
    </div>
  </div>

  <!-- 主要内容 -->
  <PlayerTracker />

  <!-- 返回链接 -->
  <div class="mt-8 text-center">
    <a href="/tools" class="text-gray-400 hover:text-white transition-colors">
      返回工具列表
    </a>
  </div>
</div>