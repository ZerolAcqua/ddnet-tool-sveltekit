<script lang="ts">
  import Navigation from '$lib/components/Navigation.svelte';
  import { authState } from '$lib/stores/auth';
  import { onMount } from 'svelte';
  import { initAuth } from '$lib/stores/auth';
  
  onMount(() => {
    initAuth();
  });
</script>

<Navigation />

<div class="container mx-auto max-w-7xl px-6 py-8">
  <!-- 网站介绍 -->
  <div class="text-center py-12">
    <h1 class="text-4xl font-bold text-white mb-4">DDNet 工具集</h1>
    <p class="text-xl text-gray-300 mb-6">专为 DDNet 玩家打造的实用工具平台</p>
    <div class="max-w-2xl mx-auto">
      <p class="text-gray-400 leading-relaxed">
        这里汇集了各种 DDNet 游戏相关的实用工具，帮助玩家更好地享受游戏体验。
        从玩家追踪到服务器监控，从数据分析到游戏助手，我们致力于为 DDNet 社区提供
        最好的工具支持。所有工具都经过精心设计，简单易用，完全免费。
      </p>
    </div>
  </div>


</div>
