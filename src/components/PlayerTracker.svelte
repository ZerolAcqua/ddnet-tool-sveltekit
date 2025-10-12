<script lang="ts">
  import { findPlayerByNames } from "../lib/api";
  import PlayerCard from "./PlayerCard.svelte";
  import type { FoundPlayer } from "../lib/api";

  const CACHE_KEY = "ddnet_player_cache";

  // 指定要搜索的玩家对象数组
  const searchPlayers = [
    { player: "Ham5terzilla" },
    { player: "ZeroMS" },
    { player: "nameless tee" }
  ];

  let results: FoundPlayer[] = [];
  let loading: boolean = false;
  let cache: FoundPlayer[] = [];

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
    loading = true;
    results = [];
    try {
      const names = searchPlayers.map(p => p.player);
      const rawResults = await findPlayerByNames(names);
      // 按玩家名排序，让相同名字连续出现
      results = rawResults.sort((a, b) => a.player.localeCompare(b.player));
      // 缓存结果到内存和 localStorage
      cache = results;
      localStorage.setItem(CACHE_KEY, JSON.stringify(results));
    } catch (e: any) {
      alert("查询失败：" + e.message);
    } finally {
      loading = false;
    }
  }

  // 页面加载时优先读取缓存，如果没有缓存才自动搜索
  loadCache();
  if (cache.length === 0) {
    searchPlayersOnline();
  }
</script>

<div class="flex flex-col items-center w-full min-h-screen">
  <div class="w-full bg-gray-800 p-8 rounded-2xl shadow-lg">
    <h2 class="mb-4 text-lg font-semibold">玩家查询结果</h2>
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
