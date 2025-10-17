<script lang="ts">
  import { getAvailableTools } from '../../tools/registry';
  import { navigate, currentRoute, getToolPath } from '../router';
  import { logout } from '../auth/auth';
  import type { User } from '../auth/auth';
  import type { Tool } from '../../tools/registry';

  export let user: User;
  export let onLogout: () => void = () => {};

  $: availableTools = getAvailableTools(user);

  function handleToolClick(tool: Tool) {
    navigate(getToolPath(tool.id));
  }

  function handleDashboardClick() {
    navigate('/');
  }

  function handleAdminClick() {
    navigate('/admin');
  }

  function handleLogout() {
    logout();
    onLogout();
  }

  // 检查当前路由
  $: currentPath = $currentRoute.path;
  $: isAdminRoute = $currentRoute.name === 'admin';
  $: isDashboard = $currentRoute.name === 'dashboard';
  $: currentToolId = $currentRoute.name === 'tool' ? $currentRoute.path.split('/')[2] : null;
</script>

<!-- 顶部导航栏 -->
<nav class="bg-gray-800 rounded-lg mb-6">
  <div class="px-4 py-3">
    <div class="flex items-center justify-between">
      <!-- 左侧：网站标题和主导航 -->
      <div class="flex items-center gap-6">
        <button
          class="text-lg font-semibold text-white hover:text-blue-400 transition-colors"
          on:click={handleDashboardClick}
        >
          DDNet 工具集
        </button>
        
        <!-- 主导航链接 -->
        <div class="flex items-center gap-4">
          <button
            class="px-3 py-1 text-sm rounded transition-colors {isDashboard ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}"
            on:click={handleDashboardClick}
          >
            首页
          </button>
          
          {#if user.isAdmin}
            <button
              class="px-3 py-1 text-sm rounded transition-colors {isAdminRoute ? 'bg-purple-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}"
              on:click={handleAdminClick}
            >
              管理
            </button>
          {/if}
        </div>
      </div>

      <!-- 右侧：工具快速访问和用户信息 -->
      <div class="flex items-center gap-4">
        <!-- 工具快速访问（非管理页面显示） -->
        {#if !isAdminRoute && availableTools.length > 0}
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-400">工具:</span>
            {#each availableTools.slice(0, 3) as tool (tool.id)}
              <button
                class="px-2 py-1 text-xs rounded transition-colors {currentToolId === tool.id ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'}"
                on:click={() => handleToolClick(tool)}
              >
                {tool.icon} {tool.name.split(' ')[0]}
              </button>
            {/each}
          </div>
        {/if}

        <!-- 用户信息 -->
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2">
            <span class="text-white text-sm">{user.username}</span>
            {#if user.isAdmin}
              <span class="bg-purple-600 text-white text-xs px-2 py-1 rounded">管理员</span>
            {/if}
          </div>
          <button
            class="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            on:click={handleLogout}
          >
            退出
          </button>
        </div>
      </div>
    </div>
  </div>
</nav>