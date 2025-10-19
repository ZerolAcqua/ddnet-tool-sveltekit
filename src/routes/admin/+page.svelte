<script lang="ts">
  import { onMount } from 'svelte';
  import Navigation from '$lib/components/Navigation.svelte';

  // 页面数据由 +page.ts 加载函数提供
  export const data = undefined;

  let users: any[] = [];
  let settings: any = {};
  let isLoading = true;
  let isUpdatingSettings = false;

  onMount(async () => {
    await Promise.all([loadUsers(), loadSettings()]);
  });

  async function loadUsers() {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        users = data.users || [];
      }
    } catch (error) {
      console.error('加载用户列表失败:', error);
    }
  }

  async function loadSettings() {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        settings = data.settings || {};
      }
    } catch (error) {
      console.error('加载系统设置失败:', error);
    } finally {
      isLoading = false;
    }
  }

  async function toggleRegistrationSetting() {
    if (isUpdatingSettings) return;
    
    isUpdatingSettings = true;
    try {
      const newValue = !settings.registrationDisabled;
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          setting: 'registrationDisabled',
          value: newValue
        })
      });

      if (response.ok) {
        settings.registrationDisabled = newValue;
        // 显示成功消息（可选）
        console.log('设置已更新');
      } else {
        const errorData = await response.json();
        console.error('更新设置失败:', errorData.message);
        alert('更新设置失败: ' + errorData.message);
      }
    } catch (error) {
      console.error('更新设置失败:', error);
      alert('更新设置失败，请重试');
    } finally {
      isUpdatingSettings = false;
    }
  }
</script>

<svelte:head>
  <title>管理面板 - DDNet 工具集</title>
</svelte:head>

<Navigation />

<div class="container mx-auto max-w-7xl px-6 py-8">
  {#if isLoading}
    <div class="min-h-[400px] flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p class="text-gray-300">加载中...</p>
      </div>
    </div>
  {:else}
    <!-- 页面标题 -->
    <div class="card mb-6">
      <div>
        <h1 class="text-3xl font-bold text-white mb-2">管理面板</h1>
        <p class="text-gray-300">系统管理和用户管理功能</p>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div class="card text-center">
        <h3 class="text-xl font-semibold mb-1">用户总数</h3>
        <p class="text-gray-400">{users.length} 个用户</p>
      </div>
      
      <div class="card text-center">
        <h3 class="text-xl font-semibold mb-1">工具数量</h3>
        <p class="text-gray-400">1 个工具</p>
      </div>
      
      <div class="card text-center">
        <h3 class="text-xl font-semibold mb-1">系统状态</h3>
        <p class="text-gray-400">运行正常</p>
      </div>
    </div>

    <!-- 用户列表 -->
    <div class="card">
      <h3 class="text-xl font-semibold mb-4">用户管理</h3>
      {#if users.length > 0}
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-600">
                <th class="text-left py-3 px-4">用户名</th>
                <th class="text-left py-3 px-4">权限</th>
                <th class="text-left py-3 px-4">注册时间</th>
              </tr>
            </thead>
            <tbody>
              {#each users as user}
                <tr class="border-b border-gray-700 hover:bg-gray-700/50">
                  <td class="py-3 px-4 font-medium">{user.username}</td>
                  <td class="py-3 px-4">
                    {#if user.isAdmin}
                      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-900/50 text-red-300">
                        管理员
                      </span>
                    {:else}
                      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-600 text-gray-400">
                        普通用户
                      </span>
                    {/if}
                  </td>
                  <td class="py-3 px-4 text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <div class="text-center py-8">
          <p class="text-gray-400">暂无用户数据</p>
        </div>
      {/if}
    </div>

    <!-- 系统设置 -->
    <div class="card mt-6">
      <h3 class="text-xl font-semibold mb-4">系统设置</h3>
      <div class="space-y-4">
        <!-- 注册设置 -->
        <div class="border border-gray-600 rounded-lg p-4">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h4 class="font-medium text-white">用户注册</h4>
              <p class="text-sm text-gray-400">控制新用户是否可以注册账号</p>
            </div>
            <div class="flex items-center space-x-3">
              <!-- 状态显示 -->
              {#if settings.registrationDisabled}
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-900/50 text-red-300">
                  已禁用
                </span>
              {:else}
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-900/50 text-green-300">
                  已启用
                </span>
              {/if}
              
              <!-- 开关按钮 -->
              <button
                on:click={toggleRegistrationSetting}
                disabled={isUpdatingSettings}
                aria-label={settings.registrationDisabled ? '启用用户注册' : '禁用用户注册'}
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 {
                  settings.registrationDisabled 
                    ? 'bg-gray-600' 
                    : 'bg-blue-600'
                }"
              >
                <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {
                  settings.registrationDisabled 
                    ? 'translate-x-1' 
                    : 'translate-x-6'
                }"></span>
              </button>
            </div>
          </div>
          
          <div class="text-sm text-gray-400">
            {#if settings.registrationDisabled}
              新用户无法注册，但现有用户可以正常登录。
            {:else}
              新用户可以自由注册账号。
            {/if}
            {#if isUpdatingSettings}
              <span class="text-yellow-400">正在更新...</span>
            {/if}
          </div>
        </div>
      </div>
    </div>

    <!-- 系统信息 -->
    <div class="card mt-6">
      <h3 class="text-xl font-semibold mb-4">系统信息</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <h4 class="font-medium text-white mb-2">技术栈</h4>
          <ul class="space-y-1 text-gray-300">
            <li>• SvelteKit</li>
            <li>• TypeScript</li>
            <li>• TailwindCSS</li>
            <li>• SQLite + Drizzle ORM</li>
          </ul>
        </div>
        <div>
          <h4 class="font-medium text-white mb-2">功能模块</h4>
          <ul class="space-y-1 text-gray-300">
            <li>• 用户认证系统</li>
            <li>• 玩家追踪器</li>
            <li>• 管理面板</li>
            <li>• 实时通知</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 返回首页 -->
    <div class="mt-8 text-center">
      <a href="/" class="text-gray-400 hover:text-white transition-colors">
        返回首页
      </a>
    </div>
  {/if}
</div>