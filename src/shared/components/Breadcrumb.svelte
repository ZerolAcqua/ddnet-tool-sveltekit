<script lang="ts">
  import { getAvailableTools, getToolById } from '../../tools/registry';
  import { navigate, currentRoute, getToolPath } from '../router';
  import type { User } from '../auth/auth';

  export let user: User | null;

  $: availableTools = user ? getAvailableTools(user) : [];

  function handleToolClick(toolId: string) {
    navigate(getToolPath(toolId));
  }

  function handleDashboardClick() {
    navigate('/');
  }

  // 检查当前路由
  $: isAdminRoute = $currentRoute.name === 'admin';
  $: isDashboard = $currentRoute.name === 'dashboard';
  $: currentToolId = $currentRoute.name === 'tool' ? $currentRoute.path.split('/')[2] : null;
  $: currentTool = currentToolId ? getToolById(currentToolId) : null;

  // 构建面包屑路径
  $: breadcrumbs = (() => {
    const crumbs = [
      { name: '首页', path: '/', active: isDashboard, icon: '🏠' }
    ];

    if (currentTool) {
      crumbs.push({
        name: currentTool.name,
        path: getToolPath(currentTool.id),
        active: true,
        icon: currentTool.icon
      });
    } else if (isAdminRoute) {
      crumbs.push({
        name: '管理面板',
        path: '/admin',
        active: true,
        icon: '👑'
      });
    }

    return crumbs;
  })();
</script>

<!-- 面包屑导航 -->
<div class="container mx-auto max-w-7xl px-6 py-4">
  <div class="flex items-center gap-2">
    {#each breadcrumbs as crumb, index (crumb.path)}
      <!-- 分隔符 -->
      {#if index > 0}
        <span class="text-gray-500 mx-1">></span>
      {/if}
      
      <!-- 面包屑项目 -->
      <button
        class="px-3 py-2 text-sm rounded-lg font-medium transition-colors {crumb.active ? '!bg-gray-600 !text-white' : '!bg-gray-700 !text-gray-300 hover:!bg-gray-600 hover:!text-white'} !border-0"
        on:click={() => navigate(crumb.path)}
        disabled={crumb.active && breadcrumbs.length === 1}
      >
        {crumb.name}
      </button>
    {/each}


  </div>
</div>