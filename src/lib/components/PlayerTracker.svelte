<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import PlayerCard from '$lib/components/PlayerCard.svelte';
  import PlayerManager from '$lib/components/PlayerManager.svelte';

  interface TrackedPlayer {
    id: string;
    playerName: string;
    isActive: boolean;
    notificationEnabled: boolean;
    createdAt: Date;
  }

  interface PlayerItem {
    player: string;
    server?: string;
    serverAddr?: string;
    map?: string;
    location?: string;
    score?: number;
    skin?: string;
    team?: number;
    afk?: string;
    isOnline?: boolean;
  }

  const REFRESH_INTERVAL = 120 * 1000; // 120 秒自动刷新

  let trackedPlayers: TrackedPlayer[] = [];
  let results: PlayerItem[] = [];
  let loading: boolean = false;
  let previousResults: PlayerItem[] = []; // 用于比较状态变化
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastManualRefresh = 0;
  const DEBOUNCE = 1500; // 1.5秒防抖
  let notificationPermission: NotificationPermission = "default";

  let countdown = Math.floor(REFRESH_INTERVAL / 1000); // 剩余秒数
  let countdownTimer: ReturnType<typeof setInterval> | null = null;
  let notificationsEnabled = true; // 通知开关

  // 请求通知权限
  async function requestNotificationPermission() {
    if (!browser || !("Notification" in window)) return "denied";
    
    const permission = await Notification.requestPermission();
    notificationPermission = permission;
    return permission;
  }

  // 发送上线通知（合并多个玩家）
  function sendOnlineNotification(onlinePlayers: PlayerItem[]) {
    if (!browser || notificationPermission !== "granted" || !notificationsEnabled || onlinePlayers.length === 0) return;
    
    if (onlinePlayers.length === 1) {
      // 单个玩家上线
      const player = onlinePlayers[0];
      new Notification(`${player.player} 已上线！`, {
        body: `服务器: ${player.server}\n地图: ${player.map}`,
        icon: "/favicon.ico",
        tag: "player-online-single",
      });
    } else {
      // 多个玩家上线
      const playerNames = onlinePlayers.map(p => p.player).join(", ");
      new Notification(`${onlinePlayers.length} 名玩家已上线！`, {
        body: `玩家: ${playerNames}`,
        icon: "/favicon.ico",
        tag: "player-online-multiple",
      });
    }
  }

  // 切换通知设置
  async function toggleNotifications() {
    if (!notificationsEnabled) {
      // 如果要开启通知，需要请求权限
      const permission = await requestNotificationPermission();
      if (permission === "granted") {
        notificationsEnabled = true;
      }
    } else {
      notificationsEnabled = false;
    }
  }

  // 检测玩家状态变化
  function detectPlayerStatusChanges(newResults: PlayerItem[]) {
    if (previousResults.length === 0) {
      // 首次加载，不发送通知
      previousResults = [...newResults];
      return;
    }

    // 收集所有新上线的玩家
    const newlyOnlinePlayers: PlayerItem[] = [];
    
    for (const newPlayer of newResults) {
      const oldPlayer = previousResults.find(p => p.player === newPlayer.player);
      
      // 如果玩家之前离线，现在在线，或者是新检测到的玩家
      if (!oldPlayer || (oldPlayer.isOnline === false && newPlayer.isOnline === true)) {
        newlyOnlinePlayers.push(newPlayer);
      }
    }

    if (newlyOnlinePlayers.length > 0) {
      sendOnlineNotification(newlyOnlinePlayers);
    }

    previousResults = [...newResults];
  }

  // 加载追踪玩家列表
  async function loadTrackedPlayers() {
    try {
      const response = await fetch('/api/tools/player-tracker');
      const data = await response.json();
      
      if (data.success) {
        trackedPlayers = data.players || [];
      }
    } catch (error) {
      console.error('加载追踪玩家列表失败:', error);
    }
  }

  // 查询玩家状态
  async function searchPlayers(manual = false) {
    if (loading) return;
    
    if (manual) {
      const now = Date.now();
      if (now - lastManualRefresh < DEBOUNCE) {
        return; // 防抖
      }
      lastManualRefresh = now;
    }

    // 只查询激活的玩家
    const activePlayerNames = trackedPlayers
      .filter(p => p.isActive)
      .map(p => p.playerName);

    if (activePlayerNames.length === 0) {
      results = [];
      return;
    }

    loading = true;

    try {
      const response = await fetch('/api/tools/player-tracker/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerNames: activePlayerNames })
      });

      const data = await response.json();

      if (data.success) {
        const onlineResults = data.players || [];
        
        // 合并在线和离线玩家信息
        const allResults = activePlayerNames.map(playerName => {
          const onlinePlayer = onlineResults.find((p: PlayerItem) => p.player === playerName);
          
          if (onlinePlayer) {
            return onlinePlayer; // 在线玩家
          } else {
            // 离线玩家
            return {
              player: playerName,
              isOnline: false,
              server: '离线',
              serverAddr: '无',
              map: '无',
              location: '无',
              score: 0,
              skin: '无',
              team: 0,
              afk: '无',
            };
          }
        });

        detectPlayerStatusChanges(allResults);
        results = allResults;
      }
    } catch (error) {
      console.error('查询玩家失败:', error);
    } finally {
      loading = false;
    }
  }

  // 启动自动刷新
  function startAutoRefresh() {
    stopAutoRefresh(); // 先停止之前的定时器

    // 倒计时定时器
    countdownTimer = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        countdown = Math.floor(REFRESH_INTERVAL / 1000);
      }
    }, 1000);

    // 自动刷新定时器
    timer = setInterval(async () => {
      await searchPlayers();
      countdown = Math.floor(REFRESH_INTERVAL / 1000);
    }, REFRESH_INTERVAL);
  }

  // 停止自动刷新
  function stopAutoRefresh() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }

  // 手动刷新
  async function manualRefresh() {
    countdown = Math.floor(REFRESH_INTERVAL / 1000);
    await searchPlayers(true);
  }

  // 处理追踪列表更新
  async function handleTrackingUpdate() {
    await loadTrackedPlayers();
    await searchPlayers();
  }

  // 组件初始化
  onMount(async () => {
    if (browser) {
      // 检查通知权限
      if ("Notification" in window) {
        notificationPermission = Notification.permission;
      }

      await loadTrackedPlayers();
      await searchPlayers();
      startAutoRefresh();
    }
  });

  // 组件销毁
  onDestroy(() => {
    stopAutoRefresh();
  });

  // 格式化时间
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
</script>

<div class="space-y-6">
  <!-- 追踪玩家管理 -->
  <PlayerManager players={trackedPlayers} onUpdate={handleTrackingUpdate} />

  <!-- 控制面板 -->
  <div class="card">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h3 class="text-lg font-semibold mb-2">追踪状态</h3>
        <div class="flex items-center gap-4 text-sm text-gray-300">
          <span>追踪玩家: {trackedPlayers.filter(p => p.isActive).length}/{trackedPlayers.length}</span>
          <span>在线玩家: {results.filter(p => p.isOnline !== false).length}</span>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <!-- 通知开关 -->
        <label class="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            bind:checked={notificationsEnabled}
            on:change={toggleNotifications}
            class="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
          />
          <span class="text-gray-300">通知提醒</span>
        </label>

        <!-- 自动刷新状态 -->
        <div class="text-sm text-gray-400">
          下次刷新: {formatTime(countdown)}
        </div>

        <!-- 手动刷新按钮 -->
        <button
          class="btn-primary px-4 py-2 flex items-center gap-2"
          on:click={manualRefresh}
          disabled={loading}
        >
          <svg class="w-4 h-4 {loading ? 'animate-spin' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          {loading ? '查询中...' : '立即刷新'}
        </button>
      </div>
    </div>

    {#if notificationPermission === "denied"}
      <div class="mt-4 p-3 bg-yellow-900/50 border border-yellow-500 rounded-lg">
        <p class="text-yellow-300 text-sm">
          <strong>通知权限被拒绝：</strong> 无法发送上线通知，请在浏览器设置中允许通知权限。
        </p>
      </div>
    {/if}
  </div>

  <!-- 玩家状态列表 -->
  <div class="space-y-4">
    <h3 class="text-xl font-semibold text-white">玩家状态</h3>

    {#if loading && results.length === 0}
      <div class="card text-center py-8">
        <div class="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p class="text-gray-300">正在查询玩家状态...</p>
      </div>
    {:else if results.length > 0}
      <div class="space-y-3">
        {#each results as player (player.player)}
          <PlayerCard {player} />
        {/each}
      </div>
    {:else if trackedPlayers.length === 0}
      <div class="card text-center py-12">
        <div class="text-6xl mb-4">🎯</div>
        <h4 class="text-xl font-semibold mb-2">开始追踪玩家</h4>
        <p class="text-gray-400 mb-4">添加你想要追踪的 DDNet 玩家，实时了解他们的在线状态</p>
        <p class="text-gray-500 text-sm">点击上方的"管理追踪玩家"按钮开始添加</p>
      </div>
    {:else}
      <div class="card text-center py-8">
        <div class="text-4xl mb-4">😴</div>
        <h4 class="text-lg font-semibold mb-2">所有玩家都离线了</h4>
        <p class="text-gray-400">系统会自动检查玩家状态，他们上线时会收到通知</p>
      </div>
    {/if}
  </div>

  <!-- 功能说明 -->
  <div class="card">
    <h4 class="font-semibold mb-3">功能说明</h4>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
      <div>
        <h5 class="font-medium text-white mb-2">追踪功能</h5>
        <ul class="space-y-1">
          <li>• 实时监控玩家在线状态</li>
          <li>• 每 2 分钟自动刷新</li>
          <li>• 支持启用/禁用单个玩家追踪</li>
        </ul>
      </div>
      <div>
        <h5 class="font-medium text-white mb-2">通知提醒</h5>
        <ul class="space-y-1">
          <li>• 玩家上线时自动通知</li>
          <li>• 可选择开启/关闭通知</li>
          <li>• 点击玩家卡片复制服务器地址</li>
        </ul>
      </div>
    </div>
  </div>
</div>