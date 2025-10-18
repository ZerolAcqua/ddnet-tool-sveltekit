<script lang="ts">
  import { onMount } from 'svelte';
  import Navigation from '$lib/components/Navigation.svelte';

  // 页面数据由 +page.ts 加载函数提供
  export const data = undefined;

  let users: any[] = [];
  let isLoading = true;

  onMount(async () => {
    await loadUsers();
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
    } finally {
      isLoading = false;
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