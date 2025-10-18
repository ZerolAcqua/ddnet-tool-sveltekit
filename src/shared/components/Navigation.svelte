<script lang="ts">
  import { navigate } from '../router';
  import { logout } from '../auth/auth';
  import type { User } from '../auth/auth';

  export let user: User | null;
  export let onLogout: () => void = () => {};

  let showUserMenu = false;

  function handleDashboardClick() {
    navigate('/');
  }

  function handleAdminClick() {
    navigate('/admin');
    showUserMenu = false;
  }

  function handleLoginClick() {
    navigate('/login');
  }

  function handleLogout() {
    logout();
    onLogout();
    showUserMenu = false;
  }

  function toggleUserMenu() {
    showUserMenu = !showUserMenu;
  }

  // 点击外部关闭菜单
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu-container')) {
      showUserMenu = false;
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

<!-- 顶部导航栏 - 占满宽度 -->
<nav class="bg-gray-800 border-b border-gray-700">
  <div class="container mx-auto max-w-7xl px-6 py-4">
    <div class="flex items-center justify-between">
      <!-- 左侧：网站标题（返回主页） -->
      <div
        class="text-xl font-bold text-white hover:text-blue-400 transition-colors cursor-pointer"
        on:click={handleDashboardClick}
        on:keydown={(e) => e.key === 'Enter' && handleDashboardClick()}
        role="button"
        tabindex="0"
      >
        DDNet 工具集
      </div>

      <!-- 右侧：用户菜单或登录按钮 -->
      <div class="relative user-menu-container">
        {#if user}
          <!-- 已登录：显示用户菜单 -->
          <div
            class="flex items-center gap-2 text-white text-sm cursor-pointer hover:text-blue-400 transition-colors"
            on:click={toggleUserMenu}
            on:keydown={(e) => e.key === 'Enter' && toggleUserMenu()}
            role="button"
            tabindex="0"
          >
            <span class="font-medium">{user.username}</span>
            {#if user.isAdmin}
              <span class="bg-purple-600 text-white text-xs px-2 py-1 rounded">管理员</span>
            {/if}
            <svg 
              class="w-3 h-3 transform transition-transform {showUserMenu ? 'rotate-180' : ''} text-gray-400" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </div>

          <!-- 下拉菜单 -->
          {#if showUserMenu}
            <div class="absolute right-0 top-full mt-2 w-48 bg-gray-700 border border-gray-600 rounded-lg shadow-xl z-50">
              <div class="py-1">
                <!-- 用户信息 -->
                <div class="px-4 py-3 border-b border-gray-600">
                  <div class="text-sm text-white font-medium">{user.username}</div>
                  <div class="text-xs text-gray-300">
                    {#if user.isAdmin}
                      系统管理员
                    {:else}
                      普通用户
                    {/if}
                  </div>
                </div>

                <!-- 菜单项 -->
                {#if user.isAdmin}
                  <div
                    class="px-4 py-3 text-sm text-gray-200 hover:bg-gray-600 cursor-pointer transition-colors"
                    on:click={handleAdminClick}
                    on:keydown={(e) => e.key === 'Enter' && handleAdminClick()}
                    role="button"
                    tabindex="0"
                  >
                    管理面板
                  </div>
                {/if}
                
                <div
                  class="px-4 py-3 text-sm text-gray-200 hover:bg-gray-600 cursor-pointer transition-colors"
                  on:click={handleLogout}
                  on:keydown={(e) => e.key === 'Enter' && handleLogout()}
                  role="button"
                  tabindex="0"
                >
                  退出登录
                </div>
              </div>
            </div>
          {/if}
        {:else}
          <!-- 未登录：显示登录按钮 -->
          <button
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            on:click={handleLoginClick}
          >
            登录
          </button>
        {/if}
      </div>
    </div>
  </div>
</nav>