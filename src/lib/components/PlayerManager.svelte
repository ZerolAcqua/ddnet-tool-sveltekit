<script lang="ts">
  import { browser } from '$app/environment';
  
  // 自动聚焦指令
  function focusOnMount(element: HTMLInputElement) {
    element.focus();
  }

  interface TrackedPlayer {
    id: string;
    playerName: string;
    isActive: boolean;
    notificationEnabled: boolean;
    createdAt: Date;
  }

  export let players: TrackedPlayer[] = [];
  export let onUpdate: () => void = () => {};

  let newPlayerName = '';
  let editingId: string | null = null;
  let editingName = '';
  let isVisible = false;
  let isLoading = false;
  let message = '';
  let showClearConfirm = false;

  // 检查编辑中的玩家名是否与其他玩家重复
  $: isEditNameDuplicate = editingId !== null && editingName.trim() !== '' && 
    players.some((p) => p.id !== editingId && p.playerName === editingName.trim());

  async function addPlayer() {
    if (!newPlayerName.trim() || players.some(p => p.playerName === newPlayerName.trim()) || isLoading) {
      return;
    }

    isLoading = true;
    message = '';

    try {
      const response = await fetch('/api/tools/player-tracker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName: newPlayerName.trim()
        })
      });

      const result = await response.json();

      if (result.success) {
        newPlayerName = '';
        message = result.message;
        onUpdate();
      } else {
        message = result.message;
      }
    } catch (error) {
      console.error('添加玩家失败:', error);
      message = '添加失败，请稍后重试';
    } finally {
      isLoading = false;
    }
  }

  async function removePlayer(id: string) {
    if (isLoading) return;

    isLoading = true;
    message = '';

    try {
      const response = await fetch(`/api/tools/player-tracker/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        message = result.message;
        onUpdate();
      } else {
        message = result.message;
      }
    } catch (error) {
      console.error('删除玩家失败:', error);
      message = '删除失败，请稍后重试';
    } finally {
      isLoading = false;
    }
  }

  async function updatePlayerSettings(id: string, updates: { isActive?: boolean; notificationEnabled?: boolean }) {
    if (isLoading) return;

    isLoading = true;

    try {
      const response = await fetch(`/api/tools/player-tracker/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });

      const result = await response.json();

      if (result.success) {
        onUpdate();
      } else {
        message = result.message;
      }
    } catch (error) {
      console.error('更新玩家设置失败:', error);
      message = '更新失败，请稍后重试';
    } finally {
      isLoading = false;
    }
  }

  function startEdit(id: string, currentName: string) {
    editingId = id;
    editingName = currentName;
  }

  async function saveEdit() {
    if (!editingName.trim() || editingId === null || isEditNameDuplicate || isLoading) {
      return;
    }

    // 如果名字没有改变，直接取消编辑
    const currentPlayer = players.find(p => p.id === editingId);
    if (currentPlayer && currentPlayer.playerName === editingName.trim()) {
      cancelEdit();
      return;
    }

    isLoading = true;
    message = '';

    try {
      const response = await fetch(`/api/tools/player-tracker/${editingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName: editingName.trim()
        })
      });

      const result = await response.json();
      
      if (result.success) {
        message = '玩家名更新成功';
        cancelEdit();
        onUpdate();
      } else {
        message = result.message;
      }
    } catch (error) {
      console.error('更新玩家名失败:', error);
      message = '更新失败，请稍后重试';
    } finally {
      isLoading = false;
    }
  }

  function cancelEdit() {
    editingId = null;
    editingName = '';
  }

  function handleKeydown(event: KeyboardEvent, action: string) {
    if (event.key === 'Enter') {
      if (action === 'add') {
        addPlayer();
      } else if (action === 'edit') {
        saveEdit();
      }
    } else if (event.key === 'Escape' && action === 'edit') {
      cancelEdit();
    }
  }

  function togglePanel() {
    isVisible = !isVisible;
  }

  // 清除消息
  function clearMessage() {
    message = '';
  }

  // 清空所有玩家
  async function clearAllPlayers() {
    if (isLoading || players.length === 0) return;

    isLoading = true;
    message = '';

    try {
      const response = await fetch('/api/tools/player-tracker', {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        message = result.message;
        showClearConfirm = false;
        onUpdate();
      } else {
        message = result.message;
      }
    } catch (error) {
      console.error('清空玩家列表失败:', error);
      message = '清空失败，请稍后重试';
    } finally {
      isLoading = false;
    }
  }

  function showClearConfirmDialog() {
    showClearConfirm = true;
  }

  function hideClearConfirmDialog() {
    showClearConfirm = false;
  }

  // 自动清除消息
  $: if (message && browser) {
    setTimeout(clearMessage, 5000);
  }
</script>

<div class="mb-6">
  <button
    class="btn-secondary flex items-center gap-2"
    on:click={togglePanel}
    disabled={isLoading}
  >
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13 5.197v1a6 6 0 01-12 0v-1"></path>
    </svg>
    管理追踪玩家 ({players.length})
    <svg class="w-4 h-4 transition-transform {isVisible ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
    </svg>
  </button>

  {#if isVisible}
    <div class="mt-4 card">
      <h3 class="text-lg font-semibold mb-4 text-white">玩家追踪列表管理</h3>
      
      <!-- 消息提示 -->
      {#if message}
        <div class="mb-4 p-3 bg-blue-900/50 border border-blue-500 rounded-lg">
          <div class="flex justify-between items-center">
            <p class="text-blue-300 text-sm">{message}</p>
            <button on:click={clearMessage} class="btn-icon" title="关闭消息">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      {/if}
      
      <!-- 添加新玩家 -->
      <div class="mb-6">
        <div class="flex gap-2">
          <input
            type="text"
            placeholder="输入玩家名称"
            class="input-field flex-1"
            bind:value={newPlayerName}
            on:keydown={(e) => handleKeydown(e, 'add')}
            disabled={isLoading}
          />
          <button
            class="btn-primary"
            on:click={addPlayer}
            disabled={!newPlayerName.trim() || players.some(p => p.playerName === newPlayerName.trim()) || isLoading}
          >
            {isLoading ? '添加中...' : '添加'}
          </button>
        </div>
        {#if newPlayerName.trim() && players.some(p => p.playerName === newPlayerName.trim())}
          <p class="text-red-400 text-sm mt-1">该玩家已存在于列表中</p>
        {/if}
      </div>

      <!-- 玩家列表 -->
      {#if players.length > 0}
        <div class="space-y-3">
          <div class="flex justify-between items-center mb-3">
            <h4 class="text-md font-medium text-gray-300">当前追踪的玩家：</h4>
            <button
              class="btn-danger-sm"
              on:click={showClearConfirmDialog}
              disabled={isLoading}
              title="清空所有追踪玩家"
            >
              清空名单
            </button>
          </div>
          {#each players as player (player.id)}
            <div class="bg-gray-700 rounded-lg p-4">
              {#if editingId === player.id}
                <!-- 编辑模式 -->
                <div class="flex-1 mb-3">
                  <input
                    type="text"
                    class="input-field w-full"
                    bind:value={editingName}
                    on:keydown={(e) => handleKeydown(e, 'edit')}
                    use:focusOnMount
                    disabled={isLoading}
                  />
                  {#if isEditNameDuplicate}
                    <p class="text-red-400 text-xs mt-1">该玩家名已存在于列表中</p>
                  {/if}
                </div>
                <div class="flex gap-2">
                  <button
                    class="btn-primary-sm"
                    on:click={saveEdit}
                    disabled={!editingName.trim() || isEditNameDuplicate || isLoading}
                  >
                    {isLoading ? '保存中...' : '保存'}
                  </button>
                  <button
                    class="btn-secondary-sm"
                    on:click={cancelEdit}
                    disabled={isLoading}
                  >
                    取消
                  </button>
                </div>
              {:else}
                <!-- 显示模式 -->
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <span class="text-white font-medium">{player.playerName}</span>
                    <div class="flex items-center gap-3 mt-2">
                      <label class="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={player.isActive}
                          on:change={(e) => updatePlayerSettings(player.id, { isActive: (e.target as HTMLInputElement)?.checked ?? false })}
                          disabled={isLoading}
                          class="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                        />
                        <span class="text-gray-300">启用追踪</span>
                      </label>
                      <label class="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={player.notificationEnabled}
                          on:change={(e) => updatePlayerSettings(player.id, { notificationEnabled: (e.target as HTMLInputElement)?.checked ?? false })}
                          disabled={isLoading}
                          class="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                        />
                        <span class="text-gray-300">通知提醒</span>
                      </label>
                    </div>
                  </div>
                  <div class="flex gap-2">
                    <button
                      class="btn-warning-sm"
                      on:click={() => startEdit(player.id, player.playerName)}
                      disabled={isLoading}
                      title="编辑玩家名"
                    >
                      编辑
                    </button>
                    <button
                      class="btn-danger-sm"
                      on:click={() => removePlayer(player.id)}
                      disabled={isLoading}
                      title="移除玩家"
                    >
                      删除
                    </button>
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {:else}
        <div class="text-center py-8">
          <p class="text-gray-400">暂无追踪的玩家</p>
          <p class="text-gray-500 text-sm mt-1">在上方输入框中添加要追踪的玩家</p>
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- 清空确认对话框 -->
{#if showClearConfirm}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true" on:click={hideClearConfirmDialog} on:keydown={(e) => e.key === 'Escape' && hideClearConfirmDialog()}>
    <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4" role="document" on:click|stopPropagation on:keydown>
      <h3 class="text-lg font-semibold text-white mb-4">确认清空名单</h3>
      <p class="text-gray-300 mb-6">
        您确定要清空所有追踪玩家吗？此操作不可撤销，将删除 <span class="text-red-400 font-semibold">{players.length}</span> 个玩家。
      </p>
      <div class="flex gap-3 justify-end">
        <button
          class="btn-secondary"
          on:click={hideClearConfirmDialog}
          disabled={isLoading}
        >
          取消
        </button>
        <button
          class="btn-danger"
          on:click={clearAllPlayers}
          disabled={isLoading}
        >
          {isLoading ? '清空中...' : '确认清空'}
        </button>
      </div>
    </div>
  </div>
{/if}