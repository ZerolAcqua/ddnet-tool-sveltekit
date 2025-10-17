<script lang="ts">
  // 自动聚焦指令
  function focusOnMount(element: HTMLInputElement) {
    element.focus();
  }

  export let players: { player: string }[] = [];
  export let onUpdate: (players: { player: string }[]) => void = () => {};

  let newPlayerName = '';
  let editingIndex: number | null = null;
  let editingName = '';
  let isVisible = false;

  // 检查编辑中的玩家名是否与其他玩家重复
  $: isEditNameDuplicate = editingIndex !== null && editingName.trim() !== '' && 
    players.some((p, i) => i !== editingIndex && p.player === editingName.trim());

  function addPlayer() {
    if (newPlayerName.trim() && !players.some(p => p.player === newPlayerName.trim())) {
      const updatedPlayers = [...players, { player: newPlayerName.trim() }];
      onUpdate(updatedPlayers);
      newPlayerName = '';
    }
  }

  function removePlayer(index: number) {
    const updatedPlayers = players.filter((_, i) => i !== index);
    onUpdate(updatedPlayers);
  }

  function startEdit(index: number) {
    editingIndex = index;
    editingName = players[index].player;
  }

  function saveEdit() {
    if (editingName.trim() && editingIndex !== null && !isEditNameDuplicate) {
      const updatedPlayers = [...players];
      updatedPlayers[editingIndex] = { player: editingName.trim() };
      onUpdate(updatedPlayers);
      cancelEdit();
    }
  }

  function cancelEdit() {
    editingIndex = null;
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
</script>

<div class="mb-6">
  <button
    class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
    on:click={togglePanel}
  >
    管理跟踪玩家 ({players.length})
  </button>

  {#if isVisible}
    <div class="mt-4 p-6 bg-gray-800 rounded-xl shadow-lg">
      <h3 class="text-lg font-semibold mb-4 text-white">玩家跟踪列表管理</h3>
      
      <!-- 添加新玩家 -->
      <div class="mb-6">
        <div class="flex gap-2">
          <input
            type="text"
            placeholder="输入玩家名称"
            class="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            bind:value={newPlayerName}
            on:keydown={(e) => handleKeydown(e, 'add')}
          />
          <button
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            on:click={addPlayer}
            disabled={!newPlayerName.trim() || players.some(p => p.player === newPlayerName.trim())}
          >
            添加
          </button>
        </div>
        {#if newPlayerName.trim() && players.some(p => p.player === newPlayerName.trim())}
          <p class="text-red-400 text-sm mt-1">该玩家已存在于列表中</p>
        {/if}
      </div>

      <!-- 玩家列表 -->
      {#if players.length > 0}
        <div class="space-y-2">
          <h4 class="text-md font-medium text-gray-300 mb-3">当前跟踪的玩家：</h4>
          {#each players as player, index (player.player)}
            <div class="flex items-center gap-2 p-3 bg-gray-700 rounded-lg">
              {#if editingIndex === index}
                <!-- 编辑模式 -->
                <div class="flex-1">
                  <input
                    type="text"
                    class="w-full px-2 py-1 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
                    bind:value={editingName}
                    on:keydown={(e) => handleKeydown(e, 'edit')}
                    use:focusOnMount
                  />
                  {#if isEditNameDuplicate}
                    <p class="text-red-400 text-xs mt-1">该玩家名已存在于列表中</p>
                  {/if}
                </div>
                <button
                  class="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  on:click={saveEdit}
                  disabled={!editingName.trim() || isEditNameDuplicate}
                >
                  保存
                </button>
                <button
                  class="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                  on:click={cancelEdit}
                >
                  取消
                </button>
              {:else}
                <!-- 显示模式 -->
                <span class="flex-1 text-white font-medium">{player.player}</span>
                <button
                  class="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
                  on:click={() => startEdit(index)}
                  title="编辑玩家名"
                >
                  编辑
                </button>
                <button
                  class="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                  on:click={() => removePlayer(index)}
                  title="移除玩家"
                >
                  删除
                </button>
              {/if}
            </div>
          {/each}
        </div>
      {:else}
        <div class="text-center py-8">
          <p class="text-gray-400">暂无跟踪的玩家</p>
          <p class="text-gray-500 text-sm mt-1">在上方输入框中添加要跟踪的玩家</p>
        </div>
      {/if}

      <!-- 快速操作 -->
      {#if players.length > 0}
        <div class="mt-6 pt-4 border-t border-gray-600">
          <button
            class="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            on:click={() => onUpdate([])}
          >
            清空所有玩家
          </button>
        </div>
      {/if}
    </div>
  {/if}
</div>