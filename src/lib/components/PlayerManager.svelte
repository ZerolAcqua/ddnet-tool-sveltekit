<script lang="ts">
  import { browser } from '$app/environment';
  import { onDestroy } from 'svelte';
  
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
  export let onUpdate: (shouldSearch?: boolean) => void = () => {};

  let newPlayerName = '';
  let editingId: string | null = null;
  let editingName = '';
  let isVisible = false;
  let isLoading = false;
  let isBulkLoading = false; // 批量操作专用加载状态
  let message = '';
  let showClearConfirm = false;
  
  // 防抖相关变量
  let updateTimer: ReturnType<typeof setTimeout> | null = null;
  const UPDATE_DEBOUNCE = 800; // 玩家设置更新防抖时间
  let editTimer: ReturnType<typeof setTimeout> | null = null;
  const EDIT_DEBOUNCE = 500; // 编辑操作防抖时间
  
  // 新增：搜索和筛选相关状态
  let searchQuery = '';
  let filterStatus: 'all' | 'active' | 'inactive' = 'all';
  let sortBy: 'name' | 'created' | 'status' = 'name';
  let sortOrder: 'asc' | 'desc' = 'asc';
  let currentPage = 1;
  let itemsPerPage = 10;
  
  // 批量操作相关
  let selectedPlayerIds: Set<string> = new Set();
  let bulkAction: 'activate' | 'deactivate' | 'enable-notifications' | 'disable-notifications' | 'delete' = 'activate';
  let showBulkConfirm = false;
  
  // 导入导出相关
  let fileInput: HTMLInputElement;
  let importText = '';
  let showImportDialog = false;

  // 检查编辑中的玩家名是否与其他玩家重复
  $: isEditNameDuplicate = editingId !== null && editingName.trim() !== '' && 
    players.some((p) => p.id !== editingId && p.playerName === editingName.trim());

  // 筛选和搜索逻辑
  $: filteredPlayers = players
    .filter(player => {
      // 搜索筛选
      const matchesSearch = searchQuery === '' || 
        player.playerName.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 状态筛选
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'active' && player.isActive) ||
        (filterStatus === 'inactive' && !player.isActive);
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.playerName.localeCompare(b.playerName);
          break;
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'status':
          comparison = (a.isActive ? 1 : 0) - (b.isActive ? 1 : 0);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // 分页逻辑
  $: totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);
  $: paginatedPlayers = filteredPlayers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 重置分页当筛选条件改变时
  $: if (searchQuery || filterStatus) {
    currentPage = 1;
  }

  async function addPlayer() {
    if (!newPlayerName.trim() || players.some(p => p.playerName === newPlayerName.trim()) || isLoading) {
      return;
    }

    // 清除之前的编辑防抖定时器
    if (editTimer) {
      clearTimeout(editTimer);
      editTimer = null;
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
        
        // 使用防抖更新列表 - 添加玩家不需要立即搜索
        debounceUpdate(false);
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
    if (isLoading) return false;

    try {
      const response = await fetch(`/api/tools/player-tracker/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        return true;
      } else {
        console.error('删除玩家失败:', result.message);
        return false;
      }
    } catch (error) {
      console.error('删除玩家失败:', error);
      return false;
    }
  }

  async function updatePlayerSettings(id: string, updates: { isActive?: boolean; notificationEnabled?: boolean }) {
    if (isLoading) return false;

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
        return true;
      } else {
        console.error('更新玩家设置失败:', result.message);
        return false;
      }
    } catch (error) {
      console.error('更新玩家设置失败:', error);
      return false;
    }
  }

  // 切换单个玩家设置的包装函数
  async function togglePlayerSetting(id: string, updates: { isActive?: boolean; notificationEnabled?: boolean }) {
    await updatePlayerSettings(id, updates);
    debounceUpdate(false); // 状态切换不需要搜索
  }

  // 删除单个玩家的包装函数
  async function deletePlayer(id: string) {
    await removePlayer(id);
    debounceUpdate(false); // 删除不需要搜索
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

    // 清除之前的编辑防抖定时器
    if (editTimer) {
      clearTimeout(editTimer);
      editTimer = null;
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
        debounceUpdate(false); // 编辑玩家名不需要搜索
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

  // 防抖更新函数
  function debounceUpdate(shouldSearch = false) {
    // 清除之前的防抖定时器
    if (updateTimer) {
      clearTimeout(updateTimer);
    }
    
    // 设置新的防抖定时器
    updateTimer = setTimeout(() => {
      onUpdate(shouldSearch);
    }, UPDATE_DEBOUNCE);
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
        debounceUpdate();
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

  // 批量操作函数
  function togglePlayerSelection(playerId: string) {
    const newSelection = new Set(selectedPlayerIds);
    if (newSelection.has(playerId)) {
      newSelection.delete(playerId);
    } else {
      newSelection.add(playerId);
    }
    selectedPlayerIds = newSelection;
  }

  function toggleSelectAll() {
    if (selectedPlayerIds.size === paginatedPlayers.length) {
      selectedPlayerIds = new Set();
    } else {
      selectedPlayerIds = new Set(paginatedPlayers.map(p => p.id));
    }
  }

  async function executeBulkAction() {
    if (selectedPlayerIds.size === 0) return;
    
    isBulkLoading = true;
    message = '';

    try {
      const promises = Array.from(selectedPlayerIds).map(async playerId => {
        switch (bulkAction) {
          case 'activate':
            return await updatePlayerSettings(playerId, { isActive: true });
          case 'deactivate':
            return await updatePlayerSettings(playerId, { isActive: false });
          case 'enable-notifications':
            return await updatePlayerSettings(playerId, { notificationEnabled: true });
          case 'disable-notifications':
            return await updatePlayerSettings(playerId, { notificationEnabled: false });
          case 'delete':
            return await removePlayer(playerId);
          default:
            return Promise.resolve();
        }
      });

      await Promise.all(promises);
      
      selectedPlayerIds = new Set();
      showBulkConfirm = false;
      message = `批量操作完成，影响 ${promises.length} 个玩家`;
      
      // 批量操作后使用防抖更新
      debounceUpdate();
      
    } catch (error) {
      console.error('批量操作失败:', error);
      message = '批量操作失败，请稍后重试';
    } finally {
      isBulkLoading = false;
    }
  }

  function changePage(page: number) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
    }
  }

  // 导出玩家列表
  function exportPlayerList() {
    const exportData = players.map(p => ({
      playerName: p.playerName,
      isActive: p.isActive,
      notificationEnabled: p.notificationEnabled,
      createdAt: p.createdAt
    }));
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `ddnet-players-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  // 批量导入玩家
  async function importPlayers() {
    if (!importText.trim()) return;
    
    try {
      // 尝试解析 JSON
      let playerNames: string[] = [];
      
      try {
        const parsed = JSON.parse(importText);
        if (Array.isArray(parsed)) {
          playerNames = parsed
            .map(item => typeof item === 'string' ? item : item.playerName)
            .filter(name => typeof name === 'string' && name.trim());
        }
      } catch {
        // 如果不是 JSON，按行分割
        playerNames = importText
          .split('\n')
          .map(line => line.trim())
          .filter(name => name.length > 0);
      }
      
      if (playerNames.length === 0) {
        message = '没有找到有效的玩家名';
        return;
      }
      
      isLoading = true;
      let successCount = 0;
      let duplicateCount = 0;
      
      for (const playerName of playerNames) {
        try {
          const response = await fetch('/api/tools/player-tracker', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerName })
          });
          
          const result = await response.json();
          if (result.success) {
            successCount++;
          } else if (result.message.includes('已在追踪列表中')) {
            duplicateCount++;
          }
        } catch (error) {
          console.error(`导入玩家 ${playerName} 失败:`, error);
        }
      }
      
      message = `导入完成：成功 ${successCount} 个，重复 ${duplicateCount} 个`;
      importText = '';
      showImportDialog = false;
      debounceUpdate();
      
    } catch (error) {
      console.error('导入失败:', error);
      message = '导入失败，请检查格式';
    } finally {
      isLoading = false;
    }
  }

  // 自动清除消息
  $: if (message && browser) {
    setTimeout(clearMessage, 5000);
  }

  // 组件销毁时清理定时器
  onDestroy(() => {
    if (updateTimer) {
      clearTimeout(updateTimer);
      updateTimer = null;
    }
    if (editTimer) {
      clearTimeout(editTimer);
      editTimer = null;
    }
  });
</script>

<div class="mb-6">
  <button
    class="btn-secondary"
    on:click={togglePanel}
    disabled={isLoading}
  >
    管理追踪玩家 ({players.length})
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
              ×
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
          <button
            class="btn-secondary"
            on:click={() => showImportDialog = true}
            disabled={isLoading}
            title="批量导入玩家"
          >
            导入
          </button>
          
          {#if players.length > 0}
            <button
              class="btn-secondary"
              on:click={exportPlayerList}
              disabled={isLoading}
              title="导出玩家列表"
            >
              导出
            </button>
            
            <button
              class="btn-danger"
              on:click={showClearConfirmDialog}
              disabled={isLoading}
              title="清空所有追踪玩家"
            >
              清空名单
            </button>
          {/if}
        </div>
        {#if newPlayerName.trim() && players.some(p => p.playerName === newPlayerName.trim())}
          <p class="text-red-400 text-sm mt-1">该玩家已存在于列表中</p>
        {/if}
      </div>

      <!-- 搜索和筛选区域 -->
      {#if players.length > 5}
        <div class="mb-6 p-4 border border-gray-600 rounded-lg bg-gray-800">
          <h5 class="text-sm font-medium text-gray-300 mb-3">搜索和筛选</h5>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <!-- 搜索框 -->
            <div>
              <input
                type="text"
                placeholder="搜索玩家名..."
                class="input-field w-full text-sm"
                bind:value={searchQuery}
                disabled={isLoading}
              />
            </div>
            
            <!-- 状态筛选 -->
            <div>
              <select class="input-field w-full text-sm" bind:value={filterStatus} disabled={isLoading}>
                <option value="all">全部状态</option>
                <option value="active">已激活</option>
                <option value="inactive">未激活</option>
              </select>
            </div>
            
            <!-- 排序方式 -->
            <div>
              <select class="input-field w-full text-sm" bind:value={sortBy} disabled={isLoading}>
                <option value="name">按名称排序</option>
                <option value="created">按创建时间</option>
                <option value="status">按状态排序</option>
              </select>
            </div>
            
            <!-- 排序顺序 -->
            <div>
              <select class="input-field w-full text-sm" bind:value={sortOrder} disabled={isLoading}>
                <option value="asc">升序</option>
                <option value="desc">降序</option>
              </select>
            </div>
          </div>
          
          <!-- 统计信息 -->
          <div class="mt-3 flex items-center justify-between text-sm text-gray-400">
            <span>
              显示 {filteredPlayers.length} / {players.length} 个玩家
              {#if selectedPlayerIds.size > 0}
                · 已选中 {selectedPlayerIds.size} 个
              {/if}
            </span>
            
            <!-- 每页显示数量 -->
            <div class="flex items-center gap-2">
              <label for="items-per-page" class="text-xs">每页显示:</label>
              <select id="items-per-page" class="input-field text-xs py-1" bind:value={itemsPerPage} disabled={isLoading}>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 批量操作区域 -->
        {#if selectedPlayerIds.size > 0}
          <div class="mb-4 p-3 border border-blue-500 rounded-lg bg-blue-900/20">
            <div class="flex items-center justify-between">
              <span class="text-blue-300 text-sm">已选中 {selectedPlayerIds.size} 个玩家</span>
              <div class="flex items-center gap-2">
                <select class="input-field text-sm py-1 min-w-32" bind:value={bulkAction} disabled={isLoading || isBulkLoading}>
                  <option value="activate">激活追踪</option>
                  <option value="deactivate">停用追踪</option>
                  <option value="enable-notifications">开启通知</option>
                  <option value="disable-notifications">关闭通知</option>
                  <option value="delete">删除玩家</option>
                </select>
                <button
                  class="btn-primary-sm whitespace-nowrap"
                  on:click={() => showBulkConfirm = true}
                  disabled={isLoading || isBulkLoading}
                >
                  执行操作
                </button>
                <button
                  class="btn-secondary-sm whitespace-nowrap"
                  on:click={() => selectedPlayerIds = new Set()}
                  disabled={isLoading || isBulkLoading}
                >
                  取消选择
                </button>
              </div>
            </div>
          </div>
        {/if}
      {/if}

      <!-- 玩家列表 -->
      {#if players.length > 0}
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-md font-medium text-gray-300">当前追踪的玩家：</h4>
            {#if players.length > 5}
              <label class="flex items-center gap-2 text-sm text-gray-400">
                <input
                  type="checkbox"
                  checked={selectedPlayerIds.size === paginatedPlayers.length && paginatedPlayers.length > 0}
                  indeterminate={selectedPlayerIds.size > 0 && selectedPlayerIds.size < paginatedPlayers.length}
                  on:change={toggleSelectAll}
                  class="checkbox"
                  disabled={isLoading || paginatedPlayers.length === 0}
                />
                全选本页
              </label>
            {/if}
          </div>
          {#each paginatedPlayers as player (player.id)}
            <div class="border border-gray-600 rounded-lg p-4 bg-gray-800">
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
                <div class="flex items-center justify-between gap-4">
                  <div class="flex items-center gap-3 flex-1">
                    {#if players.length > 5}
                      <input
                        type="checkbox"
                        checked={selectedPlayerIds.has(player.id)}
                        on:change={() => togglePlayerSelection(player.id)}
                        class="checkbox flex-shrink-0"
                        disabled={isLoading}
                      />
                    {/if}
                    <div class="flex-1 min-w-0">
                      <span class="text-white font-medium truncate block">{player.playerName}</span>
                    </div>
                  </div>
                  
                  <!-- 右侧控制区域 -->
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <!-- 追踪状态按钮 -->
                    <button
                      class="{player.isActive ? 'btn-status-active' : 'btn-status-inactive'}"
                      on:click={() => togglePlayerSetting(player.id, { isActive: !player.isActive })}
                      disabled={isLoading}
                      title={player.isActive ? '点击停用追踪' : '点击启用追踪'}
                    >
                      <span class="hidden sm:inline">{player.isActive ? '已追踪' : '未追踪'}</span>
                      <span class="sm:hidden">{player.isActive ? '追踪' : '停用'}</span>
                    </button>
                    
                    <!-- 通知状态按钮 -->
                    <button
                      class="{player.notificationEnabled ? 'btn-status-notification-on' : 'btn-status-notification-off'}"
                      on:click={() => togglePlayerSetting(player.id, { notificationEnabled: !player.notificationEnabled })}
                      disabled={isLoading}
                      title={player.notificationEnabled ? '点击关闭通知' : '点击开启通知'}
                    >
                      <span class="hidden sm:inline">{player.notificationEnabled ? '通知开' : '通知关'}</span>
                      <span class="sm:hidden">{player.notificationEnabled ? '通知' : '静音'}</span>
                    </button>
                    
                    <!-- 操作按钮 -->
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
                      on:click={() => deletePlayer(player.id)}
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
          
          <!-- 分页控件 -->
          {#if totalPages > 1}
            <div class="flex items-center justify-between mt-6 pt-4 border-t border-gray-600">
              <div class="text-sm text-gray-400">
                第 {currentPage} 页，共 {totalPages} 页
              </div>
              
              <div class="flex items-center gap-2">
                <button
                  class="btn-secondary-sm"
                  on:click={() => changePage(currentPage - 1)}
                  disabled={currentPage === 1 || isLoading}
                >
                  上一页
                </button>
                
                <!-- 页码按钮 -->
                {#each Array(Math.min(5, totalPages)) as _, i}
                  {@const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i}
                  {#if page <= totalPages}
                    <button
                      class="{page === currentPage ? 'btn-page-active' : 'btn-page-inactive'}"
                      on:click={() => changePage(page)}
                      disabled={isLoading}
                    >
                      {page}
                    </button>
                  {/if}
                {/each}
                
                <button
                  class="btn-secondary-sm"
                  on:click={() => changePage(currentPage + 1)}
                  disabled={currentPage === totalPages || isLoading}
                >
                  下一页
                </button>
              </div>
            </div>
          {/if}
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
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true" tabindex="-1" on:keydown={(e) => e.key === 'Escape' && hideClearConfirmDialog()}>
    <section class="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4" role="document">
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
    </section>
  </div>
{/if}

<!-- 批量操作确认对话框 -->
{#if showBulkConfirm}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true" tabindex="-1" on:keydown={(e) => e.key === 'Escape' && (showBulkConfirm = false)}>
    <section class="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4" role="document">
      <h3 class="text-lg font-semibold text-white mb-4">确认批量操作</h3>
      <p class="text-gray-300 mb-6">
        您确定要对选中的 <span class="text-blue-400 font-semibold">{selectedPlayerIds.size}</span> 个玩家执行
        <span class="text-yellow-400 font-semibold">
          {#if bulkAction === 'activate'}激活追踪
          {:else if bulkAction === 'deactivate'}停用追踪
          {:else if bulkAction === 'enable-notifications'}开启通知
          {:else if bulkAction === 'disable-notifications'}关闭通知
          {:else if bulkAction === 'delete'}删除操作
          {/if}
        </span>
        吗？
        {#if bulkAction === 'delete'}
          <span class="text-red-400 block mt-2 font-medium">注意：删除操作不可撤销！</span>
        {/if}
      </p>
      <div class="flex gap-3 justify-end">
        <button
          class="btn-secondary"
          on:click={() => showBulkConfirm = false}
          disabled={isBulkLoading}
        >
          取消
        </button>
        <button
          class="btn-{bulkAction === 'delete' ? 'danger' : 'primary'}"
          on:click={executeBulkAction}
          disabled={isBulkLoading}
        >
          {isBulkLoading ? '执行中...' : '确认执行'}
        </button>
      </div>
    </section>
  </div>
{/if}

<!-- 导入玩家对话框 -->
{#if showImportDialog}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true" tabindex="-1" on:keydown={(e) => e.key === 'Escape' && (showImportDialog = false)}>
    <div class="bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4 max-h-96" role="document">
      <h3 class="text-lg font-semibold text-white mb-4">批量导入玩家</h3>
      
      <div class="mb-4">
        <label for="import-players-textarea" class="block text-sm font-medium text-gray-300 mb-2">
          输入玩家名（每行一个，或 JSON 格式）
        </label>
        <textarea
          id="import-players-textarea"
          class="input-field w-full h-32 resize-none"
          placeholder={`玩家1
玩家2
玩家3

或者 JSON 格式：
["玩家1", "玩家2", "玩家3"]`}
          bind:value={importText}
          disabled={isLoading}
        ></textarea>
      </div>
      
      <div class="text-xs text-gray-400 mb-4">
        支持格式：<br>
        • 每行一个玩家名<br>
        • JSON 数组：["玩家1", "玩家2"]<br>
        • 导出的 JSON 文件内容
      </div>
      
      <div class="flex gap-3 justify-end">
        <button
          class="btn-secondary"
          on:click={() => { showImportDialog = false; importText = ''; }}
          disabled={isLoading}
        >
          取消
        </button>
        <button
          class="btn-primary"
          on:click={importPlayers}
          disabled={!importText.trim() || isLoading}
        >
          {isLoading ? '导入中...' : '开始导入'}
        </button>
      </div>
    </div>
  </div>
{/if}