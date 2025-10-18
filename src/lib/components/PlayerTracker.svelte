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
      notificationsEnabled = (permission === "granted");
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
  <div class="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
    <h3 class="text-lg font-semibold mb-4 text-white">追踪状态</h3>
    
    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div class="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30">
        <div class="text-xs text-gray-400 uppercase tracking-wide mb-1">追踪玩家</div>
        <div class="text-2xl font-bold text-white">
          {trackedPlayers.filter(p => p.isActive).length}
          <span class="text-lg text-gray-400">/{trackedPlayers.length}</span>
        </div>
      </div>
      
      <div class="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30">
        <div class="text-xs text-gray-400 uppercase tracking-wide mb-1">在线玩家</div>
        <div class="text-2xl font-bold text-emerald-400">
          {results.filter(p => p.isOnline !== false).length}
        </div>
      </div>
      
      <div class="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30">
        <div class="text-xs text-gray-400 uppercase tracking-wide mb-1">下次刷新</div>
        <div class="text-2xl font-bold text-slate-400">
          {formatTime(countdown)}
        </div>
      </div>
    </div>

    <!-- 操作区域 -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-gray-700/50">
      <label class="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={notificationsEnabled}
          on:change={toggleNotifications}
          class="w-4 h-4 rounded border-gray-600 bg-gray-700 text-slate-600 focus:ring-slate-500 focus:ring-2"
        />
        <span class="text-gray-300">启用上线通知提醒</span>
      </label>

      <button
        class="btn-primary"
        on:click={manualRefresh}
        disabled={loading}
      >
        {loading ? '查询中...' : '立即刷新'}
      </button>
    </div>

    {#if notificationPermission === "denied"}
      <div class="mt-4 p-4 bg-amber-900/20 border border-amber-700/50 rounded-lg">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 w-5 h-5 rounded-full bg-amber-700/50 flex items-center justify-center mt-0.5">
            <span class="text-amber-400 text-xs font-bold">!</span>
          </div>
          <div>
            <p class="text-amber-300 text-sm font-medium mb-1">通知权限被拒绝</p>
            <p class="text-amber-200/80 text-xs">无法发送上线通知，请在浏览器设置中允许通知权限。</p>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- 玩家状态列表 -->
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-xl font-semibold text-white">玩家状态</h3>
      {#if results.length > 0}
        <div class="text-sm text-gray-400">
          共 {results.length} 个玩家
        </div>
      {/if}
    </div>

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
      <div class="card text-center py-16">
        <h4 class="text-xl font-semibold mb-3 text-white">开始追踪玩家</h4>
        <p class="text-gray-400 mb-2">添加你想要追踪的 DDNet 玩家，实时了解他们的在线状态</p>
        <p class="text-gray-500 text-sm">点击上方的"管理追踪玩家"按钮开始添加</p>
      </div>
    {:else}
      <div class="card text-center py-12">
        <h4 class="text-lg font-semibold mb-2 text-white">所有玩家都离线了</h4>
        <p class="text-gray-400">系统会自动检查玩家状态，他们上线时会收到通知</p>
      </div>
    {/if}
  </div>
</div>