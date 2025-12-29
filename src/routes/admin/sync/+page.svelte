<script lang="ts">
  import { onMount } from 'svelte';
  import Navigation from '$lib/components/Navigation.svelte';
  
  interface SyncStatus {
    lastSync: string | null;
    shouldSync: boolean;
    nextSyncDue: string | null;
    lastSyncStatus: string;
    currentMapCount: number;
    lastSyncMaps: number;
  }
  
  let syncStatus: SyncStatus | null = null;
  let syncInProgress = false;
  let syncMessage = '';
  
  async function loadSyncStatus() {
    try {
      const response = await fetch('/api/admin/sync-maps');
      
      // 检查 HTTP 状态码
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.error('获取同步状态失败: 认证或权限错误');
          // 可以在这里设置一个错误状态，或者跳转到登录页面
        } else {
          console.error(`获取同步状态失败: HTTP ${response.status}`);
        }
        return;
      }
      
      syncStatus = await response.json();
    } catch (error) {
      console.error('获取同步状态失败:', error);
    }
  }
  
  async function forcSync() {
    syncInProgress = true;
    syncMessage = '';
    
    try {
      const response = await fetch('/api/admin/sync-maps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ force: true })
      });
      
      const result = await response.json();
      
      // 检查 HTTP 状态码
      if (!response.ok) {
        // 处理认证/授权错误
        if (response.status === 401 || response.status === 403) {
          syncMessage = `同步失败 - ${result.message || '请先登录或权限不足'}`;
          // 如果是认证错误，可能需要跳转到登录页面
          if (response.status === 401) {
            // 可以在这里添加跳转逻辑，或者显示重新登录提示
            console.warn('用户未登录，需要重新认证');
          }
        } else {
          syncMessage = `同步失败 - ${result.message || '服务器错误'}`;
        }
        return; // 提前返回，不继续执行后续逻辑
      }
      
      // 处理成功响应
      if (result.success) {
        syncMessage = `同步成功 - 同步了 ${result.syncedMaps} 个地图`;
        // 刷新状态
        await loadSyncStatus();
      } else {
        syncMessage = `同步失败 - ${result.message}`;
      }
      
    } catch (error) {
      syncMessage = `同步失败: ${error instanceof Error ? error.message : '网络错误或服务不可用'}`;
    } finally {
      syncInProgress = false;
    }
  }
  
  function formatDate(dateStr: string | null) {
    if (!dateStr) return '从未同步';
    return new Date(dateStr).toLocaleString('zh-CN');
  }
  
  onMount(() => {
    loadSyncStatus();
    
    // 每30秒自动刷新状态
    const interval = setInterval(loadSyncStatus, 30000);
    return () => clearInterval(interval);
  });
</script>

<svelte:head>
  <title>数据同步 | DDNet 工具集</title>
</svelte:head>

<Navigation />

<div class="container mx-auto max-w-7xl px-6 py-8">
  <!-- 返回导航 -->
  <div class="mb-4">
    <a href="/admin" class="text-gray-400 hover:text-white transition-colors">
      返回管理面板
    </a>
  </div>
  
  <!-- 页面标题 -->
  <div class="card mb-6">
    <h1 class="text-3xl font-bold text-white mb-2">数据同步</h1>
    <p class="text-gray-300">DDNet 地图数据同步监控与管理</p>
  </div>
  
  {#if syncStatus}
    <!-- 同步状态 -->
    <div class="card mb-6">
      <h2 class="text-xl font-semibold mb-4">同步状态</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div>
          <div class="text-gray-400 text-sm mb-1">最后同步时间</div>
          <div class="text-white">{formatDate(syncStatus.lastSync)}</div>
        </div>
        
        <div>
          <div class="text-gray-400 text-sm mb-1">下次同步时间</div>
          <div class="text-white">{formatDate(syncStatus.nextSyncDue)}</div>
        </div>
        
        <div>
          <div class="text-gray-400 text-sm mb-1">同步状态</div>
          <div class="text-white">
            {#if syncStatus.lastSyncStatus === 'success'}
              正常
            {:else if syncStatus.lastSyncStatus === 'failed'}
              失败
            {:else}
              从未同步
            {/if}
          </div>
        </div>
        
        <div>
          <div class="text-gray-400 text-sm mb-1">当前地图总数</div>
          <div class="text-white">{syncStatus.currentMapCount.toLocaleString()}</div>
        </div>
        
        <div>
          <div class="text-gray-400 text-sm mb-1">上次同步地图数</div>
          <div class="text-white">{syncStatus.lastSyncMaps.toLocaleString()}</div>
        </div>
        
        <div>
          <div class="text-gray-400 text-sm mb-1">是否需要同步</div>
          <div class="text-white">
            {syncStatus.shouldSync ? '是' : '否'}
          </div>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="flex gap-4 mb-4">
        <button
          on:click={forcSync}
          disabled={syncInProgress}
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncInProgress ? '同步进行中...' : '强制同步'}
        </button>
        
        <button
          on:click={loadSyncStatus}
          class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          刷新状态
        </button>
      </div>
      
      {#if syncMessage}
        <div class="p-3 rounded {syncMessage.includes('成功') ? 'bg-green-900/20 text-green-300' : 'bg-red-900/20 text-red-300'}">
          {syncMessage}
        </div>
      {/if}
    </div>
    
    <!-- 说明信息 -->
    <div class="card">
      <h2 class="text-xl font-semibold mb-4">同步说明</h2>
      <div class="text-gray-300 space-y-2">
        <p>• 系统会自动检测是否需要同步（每24小时同步一次）</p>
        <p>• 访问地图指南页面时会自动检查并后台同步</p>
        <p>• 可以手动点击“强制同步”按钮立即同步最新数据</p>
        <p>• 同步期间不会影响现有功能的使用</p>
        <p>• 数据来源：<a href="https://ddnet.org/releases/maps.json" class="text-blue-400 hover:text-blue-300">DDNet 官方 API</a></p>
      </div>
    </div>
  {:else}
    <!-- 加载状态 -->
    <div class="card">
      <div class="text-center py-8">
        <p class="text-gray-300">加载同步状态中...</p>
      </div>
    </div>
  {/if}
</div>