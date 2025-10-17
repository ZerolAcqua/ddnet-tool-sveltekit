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

<div class="space-y-4">
  <h1 class="text-xl font-bold text-white">管理员面板</h1>

  <!-- 用户管理 -->
  <div class="bg-gray-800 rounded-lg p-4">
    <div class="flex items-center justify-between mb-4">
      <h2 class="font-bold text-white">用户管理</h2>
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

  <!-- 返回按钮 -->
  <div class="flex justify-center">
    <button
      class="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
      on:click={() => {
        import('../router').then(({ navigate }) => navigate('/'));
      }}
    >
      ← 返回首页
    </button>
  </div>
</div>