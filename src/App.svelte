<script lang="ts">
  import { onMount } from 'svelte';
  import { getCurrentUser } from './shared/auth/auth';
  import { navigate, currentRoute } from './shared/router';
  import type { User } from './shared/auth/auth';
  
  // 导入组件
  import AuthForm from './shared/components/AuthForm.svelte';
  import Navigation from './shared/components/Navigation.svelte';
  import Breadcrumb from './shared/components/Breadcrumb.svelte';
  import Router from './shared/components/Router.svelte';

  let user: User | null = null;
  let isLoading = true;

  // 检查用户登录状态
  onMount(() => {
    user = getCurrentUser();
    isLoading = false;
  });

  function handleLogin(loggedInUser: User) {
    user = loggedInUser;
    navigate('/');
  }

  function handleLogout() {
    user = null;
    navigate('/');
  }

  // 根据用户状态决定显示内容
  $: if (!isLoading && user !== null) {
    // 如果已登录但当前路径是登录页，重定向到首页
    if ($currentRoute.path === '/login') {
      navigate('/');
    }
  }
</script>

{#if isLoading}
  <div class="min-h-screen bg-gray-900 flex items-center justify-center">
    <div class="text-white text-xl">加载中...</div>
  </div>
{:else if $currentRoute.name === 'login'}
  <!-- 登录页面 -->
  <AuthForm onLogin={handleLogin} />
{:else}
  <!-- 主网站 -->
  <main class="min-h-screen bg-gray-900 text-white">
    
    <!-- 顶部导航栏 -->
    <Navigation {user} onLogout={handleLogout} />
    
    <!-- 面包屑导航 -->
    <Breadcrumb {user} />
    
    <!-- 主内容区 - 路由控制 -->
    <div class="container mx-auto max-w-7xl px-6 pb-6">
      <div class="min-h-[60vh]">
        <Router {user} />
      </div>
      
      <!-- 页脚 -->
      <footer class="mt-12 text-center text-sm text-gray-500 border-t border-gray-700 pt-6">
        <p>© 2025 DDNet 工具集 - 专为 DDNet 玩家打造</p>
      </footer>
    </div>
    
  </main>
{/if}
