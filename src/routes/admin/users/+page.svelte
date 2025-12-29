<script lang="ts">
  import { onMount } from "svelte";
  import Navigation from "$lib/components/Navigation.svelte";

  let users: any[] = [];
  let isLoading = true;
  let showDeleteModal = false;
  let userToDelete: any = null;
  let deleteLoading = false;
  let errorMessage: string = '';
  let message: string = '';

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

  function showDeleteUserModal(user: any) {
    userToDelete = user;
    showDeleteModal = true;
  }

  function cancelDelete() {
    showDeleteModal = false;
    userToDelete = null;
  }

  async function confirmDelete() {
    if (!userToDelete || deleteLoading) return;

    deleteLoading = true;
    try {
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // 重新加载用户列表
        await loadUsers();
        message = '用户已删除';
        setTimeout(() => { message = ''; }, 3000);
      } else {
        const errorData = await response.json();
        console.error('删除用户失败:', errorData.message);
        errorMessage = '删除用户失败: ' + errorData.message;
        setTimeout(() => { errorMessage = ''; }, 5000);
      }
    } catch (error) {
      console.error('删除用户失败:', error);
      errorMessage = '删除用户失败，请重试';
      setTimeout(() => { errorMessage = ''; }, 5000);
    } finally {
      deleteLoading = false;
      showDeleteModal = false;
      userToDelete = null;
    }
  }
</script>

<svelte:head>
  <title>用户管理 | DDNet 工具集</title>
</svelte:head>

<Navigation />

<div class="container mx-auto max-w-7xl px-6 py-8">
  {#if errorMessage}
    <div class="mb-4 p-2 rounded bg-red-900/40 text-red-300 border border-red-700/40">{errorMessage}</div>
  {/if}
  {#if message}
    <div class="mb-4 p-2 rounded bg-green-900/40 text-green-300 border border-green-700/40">{message}</div>
  {/if}
  <!-- 返回导航 -->
  <div class="mb-4">
    <a href="/admin" class="text-gray-400 hover:text-white transition-colors">
      返回管理面板
    </a>
  </div>
  
  <!-- 页面标题 -->
  <div class="card mb-6">
    <h1 class="text-3xl font-bold text-white mb-2">用户管理</h1>
    <p class="text-gray-300">管理用户账户和权限设置</p>
  </div>

  {#if isLoading}
    <div class="card">
      <div class="text-center py-8">
        <div class="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p class="text-gray-300">加载用户数据中...</p>
      </div>
    </div>
  {:else}
    <!-- 统计信息 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div class="card text-center">
        <h3 class="text-xl font-semibold mb-1">用户总数</h3>
        <p class="text-gray-400">{users.length} 个用户</p>
      </div>
      
      <div class="card text-center">
        <h3 class="text-xl font-semibold mb-1">管理员</h3>
        <p class="text-gray-400">{users.filter(u => u.isAdmin).length} 个</p>
      </div>
      
      <div class="card text-center">
        <h3 class="text-xl font-semibold mb-1">普通用户</h3>
        <p class="text-gray-400">{users.filter(u => !u.isAdmin).length} 个</p>
      </div>
    </div>

    <!-- 用户列表 -->
    <div class="card">
      <h3 class="text-xl font-semibold mb-4">用户列表</h3>
      {#if users.length > 0}
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-600">
                <th class="text-left py-3 px-4">用户名</th>
                <th class="text-left py-3 px-4">权限</th>
                <th class="text-left py-3 px-4">注册时间</th>
                <th class="text-center py-3 px-4 w-24">操作</th>
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
                    {new Date(user.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                  </td>
                  <td class="py-3 px-4 text-center">
                    {#if !user.isAdmin}
                      <button
                        on:click={() => showDeleteUserModal(user)}
                        class="text-red-400 hover:text-red-300 transition-colors text-sm"
                        title="删除用户"
                        disabled={deleteLoading}
                      >
                        删除
                      </button>
                    {:else}
                      <span class="text-gray-500 text-xs">管理员</span>
                    {/if}
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
  {/if}
</div>

<!-- 删除确认模态框 -->
{#if showDeleteModal && userToDelete}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
      <h3 class="text-lg font-semibold text-white mb-4">确认删除用户</h3>
      
      <div class="text-gray-300 mb-6">
        <p class="mb-2">您确定要删除以下用户吗？此操作无法撤销。</p>
        <div class="bg-gray-700/50 rounded p-3 text-sm">
          <strong>{userToDelete.username}</strong> • 
          {userToDelete.isAdmin ? '管理员' : '普通用户'} • 
          注册于 {new Date(userToDelete.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })}
        </div>
      </div>
      
      <div class="flex justify-end gap-3">
        <button 
          type="button"
          on:click={cancelDelete}
          class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          disabled={deleteLoading}
        >
          取消
        </button>
        <button 
          type="button"
          on:click={confirmDelete}
          class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          disabled={deleteLoading}
        >
          {deleteLoading ? '删除中...' : '确认删除'}
        </button>
      </div>
    </div>
  </div>
{/if}