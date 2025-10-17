<script lang="ts">
  import { getAvailableTools } from '../../tools/registry';
  import { navigate, getToolPath } from '../router';
  import type { User } from '../auth/auth';
  import type { Tool } from '../../tools/registry';

  export let user: User;

  $: availableTools = getAvailableTools(user);

  function handleToolClick(tool: Tool) {
    navigate(getToolPath(tool.id));
  }
</script>

<div class="space-y-8">
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

  <!-- 可用工具 -->
  <div class="bg-gray-800 rounded-lg p-6">
    <h2 class="text-xl font-bold text-white mb-6">可用工具</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each availableTools as tool (tool.id)}
        <button
          class="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors border border-gray-600 hover:border-blue-500"
          on:click={() => handleToolClick(tool)}
        >
          <div>
            <h3 class="font-medium text-white mb-2">{tool.name}</h3>
            <p class="text-sm text-gray-400 leading-relaxed">{tool.description}</p>
            <div class="mt-3">
              <span class="inline-block px-2 py-1 bg-blue-600 text-white text-xs rounded">
                {tool.category === 'game' ? '游戏' : tool.category === 'utility' ? '实用工具' : '数据分析'}
              </span>
            </div>
          </div>
        </button>
      {/each}
    </div>
  </div>

  <!-- 快速开始 -->
  <div class="bg-gray-800 rounded-lg p-6">
    <h2 class="text-xl font-bold text-white mb-4">快速开始</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 class="font-medium text-white mb-2">新手指南</h3>
        <ul class="text-sm text-gray-400 space-y-1">
          <li>• 选择上方的工具开始使用</li>
          <li>• 每个工具都有详细的使用说明</li>
          <li>• 数据会自动保存在本地浏览器中</li>
        </ul>
      </div>
      <div>
        <h3 class="font-medium text-white mb-2">功能特色</h3>
        <ul class="text-sm text-gray-400 space-y-1">
          <li>• 实时数据更新</li>
          <li>• 简洁直观的界面</li>
          <li>• 完全免费使用</li>
        </ul>
      </div>
    </div>
  </div>
</div>