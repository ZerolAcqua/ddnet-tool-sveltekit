<script lang="ts">
  import { onMount } from "svelte";
  import Navigation from "$lib/components/Navigation.svelte";
  import { tools, getToolStats } from "$lib/config/tools";

  let settings: any = {};
  let isLoading = true;
  let isUpdatingSettings = false;
  let systemStatus = 'checking'; // checking, healthy, error
  let statusMessage = '检查中...';

  // 计算工具统计
  $: toolStats = getToolStats();

  onMount(async () => {
    await Promise.all([loadSettings(), checkSystemHealth()]);
  });

  async function loadSettings() {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        settings = data.settings || {};
      }
    } catch (error) {
      console.error('加载系统设置失败:', error);
    } finally {
      isLoading = false;
    }
  }

  async function checkSystemHealth() {
    /* 
     * TODO: 系统健康检查功能需要进一步完善
     * 
     * 当前问题:
     * 1. 只检查基础API端点，不够全面
     * 2. 缺少数据库连接检查
     * 3. 缺少外部服务（DDNet API）状态检查
     * 4. 没有响应时间监控
     * 5. 缺少历史状态记录
     * 
     * 改进计划:
     * - 将健康检查逻辑提取为独立模块 (/lib/health/)
     * - 添加更详细的检查项目（数据库、缓存、第三方API等）
     * - 实现检查结果缓存和历史记录
     * - 添加性能指标监控（响应时间、内存使用等）
     * - 支持不同级别的健康检查（快速/完整）
     * - 添加告警和通知机制
     */
    try {
      // 检查多个系统组件的健康状态
      const healthChecks = [
        { name: '用户API', url: '/api/admin/users' },
        { name: '设置API', url: '/api/admin/settings' },
        { name: '工具API', url: '/api/tools/player-tracker' }
      ];

      const results = await Promise.allSettled(
        healthChecks.map(async (check) => {
          const response = await fetch(check.url);
          return { name: check.name, ok: response.ok, status: response.status };
        })
      );

      const failedChecks = results.filter(
        (result) => result.status === 'rejected' || !result.value.ok
      );

      if (failedChecks.length === 0) {
        systemStatus = 'healthy';
        statusMessage = '运行正常';
      } else {
        systemStatus = 'error';
        statusMessage = `${failedChecks.length} 个服务异常`;
      }
    } catch (error) {
      console.error('系统健康检查失败:', error);
      systemStatus = 'error';
      statusMessage = '检查失败';
    }
  }

  async function toggleRegistrationSetting() {
    if (isUpdatingSettings) return;
    
    isUpdatingSettings = true;
    try {
      const newValue = !settings.registrationDisabled;
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          setting: 'registrationDisabled',
          value: newValue
        })
      });

      if (response.ok) {
        settings.registrationDisabled = newValue;
        // 显示成功消息（可选）
        console.log('设置已更新');
      } else {
        const errorData = await response.json();
        console.error('更新设置失败:', errorData.message);
        alert('更新设置失败: ' + errorData.message);
      }
    } catch (error) {
      console.error('更新设置失败:', error);
      alert('更新设置失败，请重试');
    } finally {
      isUpdatingSettings = false;
    }
  }
</script>

<svelte:head>
  <title>管理面板 - DDNet 工具集</title>
</svelte:head>

<Navigation />

<div class="container mx-auto max-w-7xl px-6 py-8">
  {#if isLoading}
    <div class="min-h-[400px] flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p class="text-gray-300">加载中...</p>
      </div>
    </div>
  {:else}
    <!-- 页面标题 -->
    <div class="card mb-6">
      <div>
        <h1 class="text-3xl font-bold text-white mb-2">管理面板</h1>
        <p class="text-gray-300">系统管理和用户管理功能</p>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div class="card text-center">
        <h3 class="text-xl font-semibold mb-1">工具数量</h3>
        <p class="text-gray-400">{toolStats.available} 个工具可用</p>
      </div>
      
      <div class="card text-center">
        <h3 class="text-xl font-semibold mb-1">系统状态</h3>
        <div class="flex items-center justify-center gap-2">
          {#if systemStatus === 'checking'}
            <div class="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <p class="text-yellow-400">{statusMessage}</p>
          {:else if systemStatus === 'healthy'}
            <div class="w-2 h-2 bg-green-500 rounded-full"></div>
            <p class="text-green-400">{statusMessage}</p>
          {:else}
            <div class="w-2 h-2 bg-red-500 rounded-full"></div>
            <p class="text-red-400">{statusMessage}</p>
          {/if}
        </div>
      </div>
    </div>

    <!-- 管理功能 -->
    <div class="card mt-6">
      <h3 class="text-xl font-semibold mb-4">管理功能</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- 数据同步 -->
        <a 
          href="/admin/sync" 
          class="block p-4 border border-gray-600 rounded-lg hover:border-gray-500 hover:bg-gray-700/20 transition-colors"
        >
          <h4 class="font-medium text-white mb-2">数据同步</h4>
          <p class="text-sm text-gray-400">
            监控和管理 DDNet 地图数据同步状态
          </p>
        </a>
        
        <!-- 用户管理 -->
        <a 
          href="/admin/users" 
          class="block p-4 border border-gray-600 rounded-lg hover:border-gray-500 hover:bg-gray-700/20 transition-colors"
        >
          <h4 class="font-medium text-white mb-2">用户管理</h4>
          <p class="text-sm text-gray-400">
            管理用户账户和权限设置
          </p>
        </a>
      </div>
    </div>

    <!-- 系统设置 -->
    <div class="card mt-6">
      <h3 class="text-xl font-semibold mb-4">系统设置</h3>
      <div class="space-y-4">
        <!-- 注册设置 -->
        <div class="border border-gray-600 rounded-lg p-4">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h4 class="font-medium text-white mb-3">用户注册</h4>
              <p class="text-sm text-gray-400">控制新用户是否可以注册账号</p>
            </div>
            <div class="flex items-center space-x-3">
              <!-- 状态显示 -->
              {#if settings.registrationDisabled}
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-900/50 text-red-300">
                  已禁用
                </span>
              {:else}
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-900/50 text-green-300">
                  已启用
                </span>
              {/if}
              
              <!-- 开关按钮 -->
              <button
                on:click={toggleRegistrationSetting}
                disabled={isUpdatingSettings}
                aria-label={settings.registrationDisabled ? '启用用户注册' : '禁用用户注册'}
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 {
                  settings.registrationDisabled 
                    ? 'bg-gray-600' 
                    : 'bg-blue-600'
                }"
              >
                <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {
                  settings.registrationDisabled 
                    ? 'translate-x-1' 
                    : 'translate-x-6'
                }"></span>
              </button>
            </div>
          </div>
          
          <div class="text-sm text-gray-400">
            {#if settings.registrationDisabled}
              新用户无法注册，但现有用户可以正常登录。
            {:else}
              新用户可以自由注册账号。
            {/if}
            {#if isUpdatingSettings}
              <span class="text-yellow-400">正在更新...</span>
            {/if}
          </div>
        </div>
      </div>
    </div>

    <!-- 返回首页 -->
    <div class="mt-8 text-center">
      <a href="/" class="text-gray-400 hover:text-white transition-colors">
        返回首页
      </a>
    </div>
  {/if}
</div>