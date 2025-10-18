<script lang="ts">
  import { authState, logout } from '$lib/stores/auth';
  import { goto } from '$app/navigation';

  async function handleLogout() {
    await logout();
    goto('/');
  }
</script>

<nav class="bg-gray-800 border-b border-gray-700">
  <div class="container mx-auto max-w-7xl px-6">
    <div class="flex items-center justify-between h-16">
      <!-- Logo -->
      <div class="flex items-center">
        <a href="/" class="text-xl font-bold text-white hover:text-gray-300 transition-colors">
          DDNet 工具集
        </a>
      </div>

      <!-- 导航菜单 -->
      <div class="flex items-center space-x-6">
        {#if $authState.isAuthenticated}
          <a href="/tools" class="text-gray-300 hover:text-white transition-colors">
            工具
          </a>
          
          {#if $authState.user?.isAdmin}
            <a href="/admin" class="text-gray-300 hover:text-white transition-colors">
              管理面板
            </a>
          {/if}

          <!-- 用户菜单 -->
          <div class="flex items-center space-x-4">
            <span class="text-gray-300">
              欢迎, {$authState.user?.username}
            </span>
            
            <button
              on:click={handleLogout}
              class="btn-secondary text-sm px-3 py-1"
            >
              登出
            </button>
          </div>
        {:else}
          <a href="/login" class="btn-primary text-sm px-4 py-2">
            登录
          </a>
        {/if}
      </div>
    </div>
  </div>
</nav>