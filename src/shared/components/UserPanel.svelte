<script lang="ts">
  import { logout } from '../auth/auth';
  import type { User } from '../auth/auth';

  export let user: User;
  export let onLogout: () => void = () => {};

  function handleLogout() {
    logout();
    onLogout();
  }
</script>

<div class="bg-gray-800 rounded-lg p-4 mb-4">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <span class="text-white">{user.username}</span>
      {#if user.isAdmin}
        <span class="bg-purple-600 text-white text-xs px-2 py-1 rounded">管理员</span>
      {/if}
    </div>
    <div class="flex gap-2">
      {#if user.isAdmin}
        <button
          class="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
          on:click={() => {
            import('../router').then(({ navigate }) => navigate('/admin'));
          }}
        >
          管理
        </button>
      {/if}
      <button
        class="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
        on:click={handleLogout}
      >
        退出
      </button>
    </div>
  </div>
</div>