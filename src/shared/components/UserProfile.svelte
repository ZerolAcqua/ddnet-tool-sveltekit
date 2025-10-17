<script lang="ts">
  import UserPanel from './UserPanel.svelte';
  import type { User } from '../auth/auth';

  export let user: User;
</script>

<div class="max-w-4xl mx-auto space-y-6">
  <!-- 页面标题 -->
  <div class="bg-gray-800 rounded-xl p-6">
    <h1 class="text-2xl font-bold text-white mb-2">👤 个人资料</h1>
    <p class="text-gray-400">管理你的账户信息和偏好设置</p>
  </div>

  <!-- 用户面板 -->
  <UserPanel {user} onLogout={() => {
    import('../router').then(({ navigate }) => navigate('/login'));
  }} />

  <!-- 使用统计 -->
  <div class="bg-gray-800 rounded-xl p-6">
    <h2 class="text-xl font-bold text-white mb-4">📊 使用统计</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-gray-700 rounded-lg p-4">
        <div class="text-2xl font-bold text-blue-400">--</div>
        <div class="text-sm text-gray-400">工具使用次数</div>
      </div>
      <div class="bg-gray-700 rounded-lg p-4">
        <div class="text-2xl font-bold text-green-400">--</div>
        <div class="text-sm text-gray-400">数据查询次数</div>
      </div>
      <div class="bg-gray-700 rounded-lg p-4">
        <div class="text-2xl font-bold text-purple-400">--</div>
        <div class="text-sm text-gray-400">在线时长</div>
      </div>
    </div>
    <p class="text-gray-500 text-sm mt-4">* 统计功能将在后续版本中提供</p>
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