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
  <!-- 可用工具 -->
  <div class="bg-gray-800 rounded-xl p-6">
    <h2 class="text-lg font-medium text-white mb-4">可用工具</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {#each availableTools as tool (tool.id)}
        <button
          class="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors"
          on:click={() => handleToolClick(tool)}
        >
          <div class="flex items-center gap-3">
            <div class="text-2xl">{tool.icon}</div>
            <div class="flex-1 min-w-0">
              <h3 class="font-medium text-white">{tool.name}</h3>
              <p class="text-sm text-gray-400 mt-1">{tool.description}</p>
            </div>
          </div>
        </button>
      {/each}
    </div>
  </div>
</div>