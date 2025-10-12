<script lang="ts">
  import { findPlayerByNames } from "../lib/api";
  import PlayerCard from "./PlayerCard.svelte";
  import type { FoundPlayer } from "../lib/api";

  // 指定要搜索的玩家对象数组
  const searchPlayers = [
    { player: "Ham5terzilla" },
    { player: "ZeroMS" },
    { player: "nameless tee" }
  ];

  let results: FoundPlayer[] = [];
  let loading: boolean = false;

  // 页面加载时自动搜索
  async function searchPlayersOnline() {
    loading = true;
    results = [];
    try {
      const names = searchPlayers.map(p => p.player);
      const rawResults = await findPlayerByNames(names);
      // 按玩家名排序，让相同名字连续出现
      results = rawResults.sort((a, b) => a.player.localeCompare(b.player));
    } catch (e: any) {
      alert("查询失败：" + e.message);
    } finally {
      loading = false;
    }
  }

  searchPlayersOnline();
</script>

<div class="flex flex-col items-center w-full min-h-screen">
  <div class="w-full bg-gray-800 p-8 rounded-2xl shadow-lg">
    <h2 class="mb-4 text-lg font-semibold">玩家查询结果</h2>
    {#if loading}
      <p class="text-gray-400">查询中...</p>
    {:else if results.length > 0}
      <div class="space-y-2">
        {#each results as player}
          <PlayerCard {player} />
        {/each}
      </div>
    {:else}
      <p class="mt-4 text-gray-400">没有找到玩家或该玩家不在线</p>
    {/if}
  </div>
</div>
