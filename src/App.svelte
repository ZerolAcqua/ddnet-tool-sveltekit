<script lang="ts">
  import { onMount } from 'svelte';
  import PlayerTracker from './components/PlayerTracker.svelte';
  import AuthForm from './components/AuthForm.svelte';
  import UserPanel from './components/UserPanel.svelte';
  import { getCurrentUser } from './lib/auth';
  import type { User } from './lib/auth';

  let user: User | null = null;
  let isLoading = true;

  // 检查用户登录状态
  onMount(() => {
    user = getCurrentUser();
    isLoading = false;
  });

  function handleLogin(loggedInUser: User) {
    user = loggedInUser;
  }

  function handleLogout() {
    user = null;
  }
</script>

{#if isLoading}
  <div class="min-h-screen bg-gray-900 flex items-center justify-center">
    <div class="text-white text-xl">加载中...</div>
  </div>
{:else if !user}
  <!-- 未登录状态显示登录表单 -->
  <AuthForm onLogin={handleLogin} />
{:else}
  <!-- 已登录状态显示主应用 -->
  <main class="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
    <h1 class="text-3xl font-bold mb-6">DDNet 玩家跟踪器</h1>
    
    <!-- 用户面板 -->
    <div class="w-full max-w-6xl">
      <UserPanel {user} onLogout={handleLogout} />
      
      <!-- 玩家追踪器 -->
      <PlayerTracker {user} />
    </div>
  </main>
{/if}
