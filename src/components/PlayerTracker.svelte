<script lang="ts">
  import { findPlayerByNames } from "../lib/api";
  import PlayerCard from "./PlayerCard.svelte";
  import PlayerManager from "./PlayerManager.svelte";
  import type { PlayerItem } from "../lib/api";
  import { onDestroy } from "svelte";

  const CACHE_KEY = "ddnet_player_cache";
  const SEARCH_PLAYERS_KEY = "ddnet_search_players";
  const REFRESH_INTERVAL = 120 * 1000; // 120 秒自动刷新

  // 默认的搜索玩家列表
  const defaultSearchPlayers = [
    { player: "nameless tee" },
  ];

  // 可编辑的搜索玩家数组
  let searchPlayers: { player: string }[] = [];

  let results: PlayerItem[] = [];
  let loading: boolean = false;
  let cache: PlayerItem[] = [];
  let previousCache: PlayerItem[] = []; // 用于比较状态变化
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastManualRefresh = 0;
  const DEBOUNCE = 1500; // 1.5秒防抖
  let updateTimer: ReturnType<typeof setTimeout> | null = null; // 玩家列表更新防抖定时器
  const UPDATE_DEBOUNCE = 800; // 玩家列表更新防抖时间
  let notificationPermission: NotificationPermission = "default";

  let countdown = Math.floor(REFRESH_INTERVAL / 1000); // 剩余秒数
  let countdownTimer: ReturnType<typeof setInterval> | null = null;
  let notificationsEnabled = true; // 通知开关

  // 请求通知权限
  async function requestNotificationPermission() {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      notificationPermission = permission;
      return permission;
    }
    return "denied";
  }

  // 发送上线通知（合并多个玩家）
  function sendOnlineNotification(onlinePlayers: PlayerItem[]) {
    if (notificationPermission !== "granted" || !notificationsEnabled || onlinePlayers.length === 0) return;
    
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
    if (previousCache.length === 0) {
      // 首次加载，不发送通知
      previousCache = [...newResults];
      return;
    }

    // 收集所有新上线的玩家
    const newlyOnlinePlayers: PlayerItem[] = [];
    
    for (const newPlayer of newResults) {
      const oldPlayer = previousCache.find(p => p.player === newPlayer.player);
      
      // 如果玩家之前离线，现在在线，添加到列表
      if (oldPlayer && oldPlayer.isOnline === false && newPlayer.isOnline === true) {
        newlyOnlinePlayers.push(newPlayer);
      }
    }

    // 如果有玩家上线，发送一次通知
    if (newlyOnlinePlayers.length > 0) {
      sendOnlineNotification(newlyOnlinePlayers);
    }

    // 更新之前的缓存
    previousCache = [...newResults];
  }

  // 从 localStorage 读取缓存
  function loadCache() {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      try {
        cache = JSON.parse(raw);
        previousCache = [...cache]; // 初始化之前的缓存
      } catch {
        cache = [];
        previousCache = [];
      }
    }
  }

  // 从 localStorage 读取搜索玩家列表
  function loadSearchPlayers() {
    const raw = localStorage.getItem(SEARCH_PLAYERS_KEY);
    if (raw) {
      try {
        searchPlayers = JSON.parse(raw);
      } catch {
        searchPlayers = [...defaultSearchPlayers];
      }
    } else {
      searchPlayers = [...defaultSearchPlayers];
    }
  }

  // 保存搜索玩家列表到 localStorage
  function saveSearchPlayers() {
    localStorage.setItem(SEARCH_PLAYERS_KEY, JSON.stringify(searchPlayers));
  }

  // 处理玩家列表更新（带防抖）
  function handlePlayersUpdate(updatedPlayers: { player: string }[]) {
    searchPlayers = updatedPlayers;
    saveSearchPlayers();
    
    // 清除之前的防抖定时器
    if (updateTimer) {
      clearTimeout(updateTimer);
    }
    
    // 设置新的防抖定时器
    updateTimer = setTimeout(() => {
      // 重新搜索玩家
      if (searchPlayers.length > 0) {
        searchPlayersOnline();
      } else {
        // 如果没有玩家，立即清空结果和缓存（不需要防抖）
        results = [];
        cache = [];
        localStorage.removeItem(CACHE_KEY);
      }
    }, UPDATE_DEBOUNCE);
  }

  async function searchPlayersOnline() {
    if (loading || searchPlayers.length === 0) return;
    loading = true;
    results = [];
    try {
      const names = searchPlayers.map(p => p.player);
      const rawResults = await findPlayerByNames(names);
      
      // 为不在线的玩家创建占位对象
      const foundNames = rawResults.map(r => r.player);
      const offlinePlayers: PlayerItem[] = searchPlayers
        .filter(p => !foundNames.includes(p.player))
        .map(p => ({
          player: p.player,
          server: "离线",
          serverAddr: "无",
          map: "无",
          location: "无",
          score: 0,
          skin: "无",
          team: 0,
          afk: "离线",
          isOnline: false
        }));
      
      // rawResults 已经是 PlayerItem[] 类型，且 isOnline 已经设置为 true
      const onlinePlayers = rawResults;
      
      // 排序：在线玩家在前，离线玩家在后，各自按名字排序
      const sortedOnline = onlinePlayers.sort((a, b) => a.player.localeCompare(b.player));
      const sortedOffline = offlinePlayers.sort((a, b) => a.player.localeCompare(b.player));
      
      results = [...sortedOnline, ...sortedOffline];
      
      // 检测玩家状态变化并发送通知
      detectPlayerStatusChanges(results);
      
      cache = results;
      localStorage.setItem(CACHE_KEY, JSON.stringify(results));
    } catch (e: any) {
      // 只在没有缓存时弹窗
      if (cache.length === 0) {
        alert("查询失败：" + e.message);
      }
    } finally {
      loading = false;
    }
  }

  // 自动刷新定时器
  function startTimer() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      if (searchPlayers.length > 0) {
        await searchPlayersOnline();
      }
      resetCountdown();
      startTimer();
    }, REFRESH_INTERVAL);
    resetCountdown();
  }

  // 刷新倒计时
  function resetCountdown() {
    if (countdownTimer) clearInterval(countdownTimer);
    countdown = Math.floor(REFRESH_INTERVAL / 1000);
    countdownTimer = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        countdown = 0;
        clearInterval(countdownTimer!);
      }
    }, 1000);
  }

  // 手动刷新，带防抖
  async function manualRefresh() {
    const now = Date.now();
    if (loading || now - lastManualRefresh < DEBOUNCE) return;
    lastManualRefresh = now;
    await searchPlayersOnline();
    resetCountdown();
    startTimer();
  }

  // 页面加载时读取数据
  loadSearchPlayers();
  loadCache();
  
  // 请求通知权限
  requestNotificationPermission();
  
  if (cache.length === 0 && searchPlayers.length > 0) {
    searchPlayersOnline();
  }
  startTimer();

  // 组件卸载时清理定时器
  onDestroy(() => {
    if (timer) clearTimeout(timer);
    if (countdownTimer) clearInterval(countdownTimer);
    if (updateTimer) clearTimeout(updateTimer);
  });
</script>

<div class="flex flex-col items-center w-full min-h-screen">
  <div class="w-full bg-gray-800 p-8 rounded-2xl shadow-lg">
    <!-- 玩家管理面板 -->
    <PlayerManager 
      players={searchPlayers} 
      onUpdate={handlePlayersUpdate}
    />
    
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold">玩家查询结果</h2>
      <div class="flex items-center gap-2">
        <!-- 通知开关 -->
        <button
          class="px-4 py-2 rounded transition-colors flex items-center min-h-[2.5rem] {notificationsEnabled && notificationPermission === 'granted' 
            ? 'bg-green-600 hover:bg-green-700 text-white' 
            : 'bg-gray-600 hover:bg-gray-700 text-gray-300'}"
          on:click={toggleNotifications}
          title={notificationsEnabled && notificationPermission === 'granted' ? '点击关闭上线通知' : '点击开启上线通知'}
        >
          {notificationsEnabled && notificationPermission === 'granted' ? '通知已开启' : '通知已关闭'}
        </button>
        
        <button
          class="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600 disabled:opacity-50 min-h-[2.5rem] flex items-center"
          on:click={manualRefresh}
          disabled={loading || searchPlayers.length === 0}
        >
          {loading ? "刷新中..." : "立即刷新"}
        </button>
        <span class="text-sm text-gray-300">{countdown}s 后自动刷新</span>
      </div>
    </div>
    {#if searchPlayers.length === 0}
      <div class="text-center py-8">
        <p class="text-gray-400">请先添加要跟踪的玩家</p>
        <p class="text-gray-500 text-sm mt-1">点击上方的"管理跟踪玩家"按钮来添加玩家</p>
      </div>
    {:else if cache.length > 0}
      <div class="space-y-2">
        {#each cache as player, index (index)}
          <PlayerCard {player} />
        {/each}
      </div>
      {#if loading}
        <p class="text-gray-400 mt-2">正在刷新最新数据...</p>
      {/if}
    {:else if loading}
      <p class="text-gray-400">查询中...</p>
    {:else}
      <p class="mt-4 text-gray-400">没有找到玩家或该玩家不在线</p>
    {/if}
  </div>
</div>
