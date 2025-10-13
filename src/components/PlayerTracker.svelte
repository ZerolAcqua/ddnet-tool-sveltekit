<script lang="ts">
  import { findPlayerByNames } from "../lib/api";
  import PlayerCard from "./PlayerCard.svelte";
  import type { FoundPlayer } from "../lib/api";
  import { onDestroy } from "svelte";

  const CACHE_KEY = "ddnet_player_cache";
  const REFRESH_INTERVAL = 120 * 1000; // 120 秒自动刷新

  // 指定要搜索的玩家对象数组
  const searchPlayers = [
    { player: "Ham5terzilla" },
    { player: "ZeroMS" },
    { player: "nameless tee" },
    { player: "Zerol Acqua" }
  ];

  let results: FoundPlayer[] = [];
  let loading: boolean = false;
  let cache: FoundPlayer[] = [];
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastManualRefresh = 0;
  const DEBOUNCE = 1500; // 1.5秒防抖

  let countdown = Math.floor(REFRESH_INTERVAL / 1000); // 剩余秒数
  let countdownTimer: ReturnType<typeof setInterval> | null = null;

  // 从 localStorage 读取缓存
  function loadCache() {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      try {
        cache = JSON.parse(raw);
      } catch {
        cache = [];
      }
    }
  }

  async function searchPlayersOnline() {
    if (loading) return;
    loading = true;
    results = [];
    try {
      const names = searchPlayers.map(p => p.player);
      const rawResults = await findPlayerByNames(names);
      
      // 为不在线的玩家创建占位对象
      const foundNames = rawResults.map(r => r.player);
      const offlinePlayers = searchPlayers
        .filter(p => !foundNames.includes(p.player))
        .map(p => ({
          player: p.player,
          server: "离线",
          map: "无",
          location: "无",
          score: 0,
          skin: "无",
          team: 0,
          afk: "离线",
          isOnline: false
        }));
      
      // 在线玩家标记为在线
      const onlinePlayers = rawResults.map(p => ({ ...p, isOnline: true }));
      
      // 排序：在线玩家在前，离线玩家在后，各自按名字排序
      const sortedOnline = onlinePlayers.sort((a, b) => a.player.localeCompare(b.player));
      const sortedOffline = offlinePlayers.sort((a, b) => a.player.localeCompare(b.player));
      
      results = [...sortedOnline, ...sortedOffline];
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
      await searchPlayersOnline();
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

  // 页面加载时优先读取缓存，如果没有缓存才自动搜索
  loadCache();
  if (cache.length === 0) {
    searchPlayersOnline();
  }
  startTimer();

  // 组件卸载时清理定时器
  onDestroy(() => {
    if (timer) clearTimeout(timer);
    if (countdownTimer) clearInterval(countdownTimer);
  });
</script>

<div class="flex flex-col items-center w-full min-h-screen">
  <div class="w-full bg-gray-800 p-8 rounded-2xl shadow-lg">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold">玩家查询结果</h2>
      <div class="flex items-center gap-2">
        <button
          class="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600 disabled:opacity-50 ml-4"
          on:click={manualRefresh}
          disabled={loading}
        >
          {loading ? "刷新中..." : "立即刷新"}
        </button>
        <span class="text-sm text-gray-300">{countdown}s 后自动刷新</span>
      </div>
    </div>
    {#if cache.length > 0}
      <div class="space-y-2">
        {#each cache as player}
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
