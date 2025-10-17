<script lang="ts">
  import { getAllUsers } from '../auth/auth';
  import type { User } from '../auth/auth';

  export let user: User;

  let allUsers: User[] = [];
  let isLoading = false;

  // 加载所有用户
  function loadAllUsers() {
    isLoading = true;
    try {
      allUsers = getAllUsers();
    } finally {
      isLoading = false;
    }
  }

  // 页面加载时获取用户列表
  loadAllUsers();

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('zh-CN');
  }
</script>

<div class="w-full">
  <!-- 管理面板标题 -->
  <div class="bg-gray-800 rounded-xl p-6 mb-6">
    <h2 class="text-2xl font-bold text-white mb-4">管理员面板</h2>
    <p class="text-gray-300 mb-4">系统管理和用户监控中心，管理平台用户和系统设置。</p>
  </div>

  <!-- 用户管理 -->
  <div class="bg-gray-800 rounded-xl p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-bold text-white">用户管理</h3>
      <button
        class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        on:click={loadAllUsers}
        disabled={isLoading}
      >
        {isLoading ? '刷新中...' : '刷新'}
      </button>
    </div>
    
    {#if allUsers.length > 0}
      <div class="space-y-3">
        {#each allUsers as userItem (userItem.id)}
          <div class="bg-gray-700 rounded p-3 flex items-center justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-white">{userItem.username}</span>
                {#if userItem.isAdmin}
                  <span class="bg-purple-600 text-white text-xs px-2 py-1 rounded">管理员</span>
                {/if}
                {#if userItem.id === user.id}
                  <span class="bg-green-600 text-white text-xs px-2 py-1 rounded">当前用户</span>
                {/if}
              </div>
              <div class="text-xs text-gray-400">
                {formatDate(userItem.createdAt)}
              </div>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="text-center py-8">
        <p class="text-gray-400">暂无用户数据</p>
      </div>
    {/if}
  </div>
</div>