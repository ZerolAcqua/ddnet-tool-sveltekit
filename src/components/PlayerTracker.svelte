<script>
  import { findPlayerByNames } from "../lib/api.js";
  import PlayerCard from "./PlayerCard.svelte";

  let playerName = "";  // 输入框的玩家名字
  let results = [];     // 查询结果
  let loading = false;  // 加载状态

  // 查询多个玩家
  async function handleSearch() {
    loading = true;
    results = [];  // 清空旧结果
    try {
      const names = playerName.split(",").map(n => n.trim()).filter(Boolean);  // 将玩家名拆分为数组
      results = await findPlayerByNames(names);  // 调用查询函数
    } catch (e) {
      alert("查询失败：" + e.message);
    } finally {
      loading = false;
    }
  }
</script>

<div class="w-full max-w-2xl bg-gray-800 p-6 rounded-2xl shadow-lg">
  <label class="block text-sm text-gray-300 mb-2">输入玩家名（多个玩家名用逗号分隔）</label>
  <input
    bind:value={playerName}
    class="w-full p-2 rounded bg-gray-700 text-white mb-4"
    placeholder="例如：Ham5terzilla, ZeroMS"
  />
  <button
    on:click={handleSearch}
    class="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600 disabled:opacity-50"
    disabled={loading}
  >
    {loading ? "查询中..." : "查询玩家"}
  </button>

  {#if results.length > 0}
    <h2 class="mt-6 mb-2 text-lg font-semibold">查询结果</h2>
    <div class="space-y-2">
      {#each results as player}
        <PlayerCard {player} />
      {/each}
    </div>
  {:else if !loading && playerName}
    <p class="mt-4 text-gray-400">没有找到玩家或该玩家不在线</p>
  {/if}
</div>
