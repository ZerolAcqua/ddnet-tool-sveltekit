<script lang="ts">
  import { onMount } from 'svelte';
  import { currentRoute, routeParams, initRouter, checkAuthGuard } from '../router';
  import type { User } from '../auth/auth';
  import { getToolById } from '../../tools/registry';
  
  // 导入页面组件
  import Dashboard from './Dashboard.svelte';
  import AdminPanel from './AdminPanel.svelte';

  export let user: User | null = null;

  let currentComponent: any = null;
  let routeData: any = {};
  let isLoading = false;

  // 初始化路由
  onMount(() => {
    initRouter();
  });

  // 监听路由变化
  $: {
    if ($currentRoute) {
      handleRouteChange($currentRoute, $routeParams);
    }
  }

  async function handleRouteChange(route: any, params: any) {
    // 检查认证守卫
    if (!checkAuthGuard(route, !!user)) {
      return;
    }

    isLoading = true;
    routeData = { route, params, user };

    try {
      switch (route.name) {
        case 'dashboard':
          currentComponent = Dashboard;
          break;
          
        case 'admin':
          if (user?.isAdmin) {
            currentComponent = AdminPanel;
          } else {
            // 非管理员重定向到首页
            const { navigate } = await import('../router');
            navigate('/');
            return;
          }
          break;
          
        case 'tool':
          const toolId = params.toolId;
          const tool = getToolById(toolId);
          
          if (tool) {
            // 检查工具是否需要登录
            if (tool.requiredPermissions && tool.requiredPermissions.length > 0 && !user) {
              const { navigate } = await import('../router');
              navigate('/login');
              return;
            }
            
            try {
              const modulePromise = tool.component();
              const module = await modulePromise;
              currentComponent = module.default;
              routeData = { ...routeData, tool };
            } catch (error) {
              console.error('加载工具失败:', error);
              currentComponent = ErrorComponent;
              routeData = { ...routeData, error: '工具加载失败' };
            }
          } else {
            currentComponent = ErrorComponent;
            routeData = { ...routeData, error: '工具不存在' };
          }
          break;
          
        default:
          currentComponent = ErrorComponent;
          routeData = { ...routeData, error: '页面不存在' };
      }
    } finally {
      isLoading = false;
    }
  }

  // 错误组件
  const ErrorComponent = null; // 将在模板中处理
</script>

{#if isLoading}
  <div class="flex items-center justify-center py-12">
    <div class="text-white text-xl">加载中...</div>
  </div>
{:else if currentComponent}
  <svelte:component this={currentComponent} {...routeData} />
{:else}
  <!-- 错误页面 -->
  <div class="bg-gray-800 rounded-xl p-8 text-center">
    <div class="text-6xl mb-4">❌</div>
    <h2 class="text-xl font-bold text-white mb-2">{routeData.error || '页面加载失败'}</h2>
    <p class="text-gray-400 mb-4">请检查地址是否正确或稍后重试</p>
    <button
      class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      on:click={() => {
        import('../router').then(({ navigate }) => navigate('/'));
      }}
    >
      返回首页
    </button>
  </div>
{/if}