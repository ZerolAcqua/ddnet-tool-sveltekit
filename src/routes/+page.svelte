<script lang="ts">
  import Navigation from '$lib/components/Navigation.svelte';
  import { authState } from '$lib/stores/auth';
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

  <!-- 功能介绍 -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
    <a href="/tools/player-tracker" class="card text-center hover:bg-gray-700 transition-colors">
      <div class="text-4xl mb-4">🎯</div>
      <h3 class="text-xl font-semibold mb-2">玩家追踪</h3>
      <p class="text-gray-400">实时追踪 DDNet 玩家在线状态</p>
      <div class="mt-4">
        <span class="btn-primary inline-block px-4 py-2 text-sm">立即使用</span>
      </div>
    </a>
    
    <div class="card text-center opacity-50">
      <div class="text-4xl mb-4">📊</div>
      <h3 class="text-xl font-semibold mb-2">数据分析</h3>
      <p class="text-gray-400">深入分析游戏数据和统计信息</p>
      <div class="mt-4">
        <span class="text-gray-500 text-sm">即将推出</span>
      </div>
    </div>
    
    <div class="card text-center opacity-50">
      <div class="text-4xl mb-4">🔧</div>
      <h3 class="text-xl font-semibold mb-2">实用工具</h3>
      <p class="text-gray-400">各种便捷的游戏辅助工具</p>
      <div class="mt-4">
        <span class="text-gray-500 text-sm">即将推出</span>
      </div>
    </div>
  </div>

  <!-- 快速开始 -->
  <div class="card mt-12">
    <h2 class="text-2xl font-bold mb-6">快速开始</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 class="font-medium text-white mb-2">新用户</h3>
        <ul class="text-sm text-gray-400 space-y-1">
          <li>• 注册账号开始使用工具</li>
          <li>• 所有功能完全免费</li>
          <li>• 数据安全可靠</li>
        </ul>
      </div>
      <div>
        <h3 class="font-medium text-white mb-2">功能特色</h3>
        <ul class="text-sm text-gray-400 space-y-1">
          <li>• 实时数据更新</li>
          <li>• 现代化界面设计</li>
          <li>• 响应式布局支持</li>
        </ul>
      </div>
    </div>
  </div>
</div>
