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
      // 删除旧玩家，添加新玩家（因为玩家名是唯一标识）
      await removePlayer(editingId);
      
      // 重新添加
      const response = await fetch('/api/tools/player-tracker', {
        method: 'POST',
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
            <button on:click={clearMessage} class="text-blue-400 hover:text-blue-300" title="关闭消息">
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
            class="btn-primary px-4 py-2"
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
          <h4 class="text-md font-medium text-gray-300 mb-3">当前追踪的玩家：</h4>
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
                    class="btn-primary px-3 py-1 text-sm"
                    on:click={saveEdit}
                    disabled={!editingName.trim() || isEditNameDuplicate || isLoading}
                  >
                    {isLoading ? '保存中...' : '保存'}
                  </button>
                  <button
                    class="btn-secondary px-3 py-1 text-sm"
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
                      class="px-3 py-1 bg-amber-600 text-white text-sm rounded hover:bg-amber-700 transition-colors"
                      on:click={() => startEdit(player.id, player.playerName)}
                      disabled={isLoading}
                      title="编辑玩家名"
                    >
                      编辑
                    </button>
                    <button
                      class="btn-danger px-3 py-1 text-sm"
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
          <div class="text-4xl mb-2">👥</div>
          <p class="text-gray-400">暂无追踪的玩家</p>
          <p class="text-gray-500 text-sm mt-1">在上方输入框中添加要追踪的玩家</p>
        </div>
      {/if}
    </div>
  {/if}
</div>