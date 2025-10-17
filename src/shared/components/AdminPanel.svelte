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

<div class="max-w-6xl mx-auto space-y-6">
  <!-- 页面标题 -->
  <div class="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
    <div class="flex items-center gap-3 mb-2">
      <span class="text-2xl">👑</span>
      <h1 class="text-2xl font-bold">管理员面板</h1>
    </div>
    <p class="text-purple-100">系统管理和用户监控</p>
  </div>

  <!-- 系统统计 -->
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
    <div class="bg-gray-800 rounded-xl p-4">
      <div class="flex items-center gap-3">
        <div class="text-2xl">👥</div>
        <div>
          <div class="text-2xl font-bold text-white">{allUsers.length}</div>
          <div class="text-sm text-gray-400">总用户数</div>
        </div>
      </div>
    </div>
    
    <div class="bg-gray-800 rounded-xl p-4">
      <div class="flex items-center gap-3">
        <div class="text-2xl">👑</div>
        <div>
          <div class="text-2xl font-bold text-white">{allUsers.filter(u => u.isAdmin).length}</div>
          <div class="text-sm text-gray-400">管理员</div>
        </div>
      </div>
    </div>
    
    <div class="bg-gray-800 rounded-xl p-4">
      <div class="flex items-center gap-3">
        <div class="text-2xl">🛠️</div>
        <div>
          <div class="text-2xl font-bold text-white">1</div>
          <div class="text-sm text-gray-400">可用工具</div>
        </div>
      </div>
    </div>
    
    <div class="bg-gray-800 rounded-xl p-4">
      <div class="flex items-center gap-3">
        <div class="text-2xl">📊</div>
        <div>
          <div class="text-2xl font-bold text-white">--</div>
          <div class="text-sm text-gray-400">活跃用户</div>
        </div>
      </div>
    </div>
  </div>

  <!-- 用户管理 -->
  <div class="bg-gray-800 rounded-xl p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold text-white">👥 用户管理</h2>
      <button
        class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        on:click={loadAllUsers}
        disabled={isLoading}
      >
        {isLoading ? '刷新中...' : '刷新列表'}
      </button>
    </div>
    
    {#if allUsers.length > 0}
      <div class="space-y-3">
        {#each allUsers as userItem (userItem.id)}
          <div class="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-medium text-white">{userItem.username}</span>
                {#if userItem.isAdmin}
                  <span class="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">管理员</span>
                {/if}
                {#if userItem.id === user.id}
                  <span class="bg-green-600 text-white text-xs px-2 py-1 rounded-full">当前用户</span>
                {/if}
              </div>
              <div class="text-sm text-gray-300">
                邮箱: {userItem.email}
              </div>
              <div class="text-xs text-gray-400">
                注册时间: {formatDate(userItem.createdAt)} | ID: {userItem.id.slice(0, 16)}...
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs bg-green-600 text-white px-2 py-1 rounded-full">活跃</span>
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

  <!-- 系统设置 -->
  <div class="bg-gray-800 rounded-xl p-6">
    <h2 class="text-xl font-bold text-white mb-4">⚙️ 系统设置</h2>
    <div class="space-y-4">
      <div class="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
        <div>
          <div class="font-medium text-white">用户注册</div>
          <div class="text-sm text-gray-400">允许新用户注册账户</div>
        </div>
        <div class="bg-green-600 text-white text-sm px-3 py-1 rounded-full">启用</div>
      </div>
      
      <div class="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
        <div>
          <div class="font-medium text-white">工具访问</div>
          <div class="text-sm text-gray-400">所有用户可访问工具</div>
        </div>
        <div class="bg-green-600 text-white text-sm px-3 py-1 rounded-full">启用</div>
      </div>
      
      <div class="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
        <div>
          <div class="font-medium text-white">数据备份</div>
          <div class="text-sm text-gray-400">定期备份用户数据</div>
        </div>
        <div class="bg-yellow-600 text-white text-sm px-3 py-1 rounded-full">计划中</div>
      </div>
    </div>
  </div>

  <!-- 返回按钮 -->
  <div class="flex justify-center">
    <button
      class="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
      on:click={() => {
        import('../router').then(({ navigate }) => navigate('/'));
      }}
    >
      ← 返回首页
    </button>
  </div>
</div>