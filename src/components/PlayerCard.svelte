<script lang="ts">
  import type { PlayerItem } from "../lib/api";
  export let player: PlayerItem;

  let copySuccess = false;

  async function copyServerAddress() {
    // 只有在线玩家才能复制服务器地址
    if (player.isOnline === false || !player.serverAddr || player.serverAddr === "无") {
      return;
    }

    try {
      await navigator.clipboard.writeText(player.serverAddr);
      copySuccess = true;
      // 2秒后隐藏成功提示
      setTimeout(() => {
        copySuccess = false;
      }, 2000);
    } catch (err) {
      console.error('复制失败:', err);
      // 降级方案：使用传统的复制方法
      fallbackCopy(player.serverAddr);
    }
  }

  // 降级复制方案
  function fallbackCopy(text: string) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        copySuccess = true;
        setTimeout(() => {
          copySuccess = false;
        }, 2000);
      }
    } catch (err) {
      console.error('降级复制也失败了:', err);
    }
    
    document.body.removeChild(textArea);
  }

  // 处理键盘事件
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      copyServerAddress();
    }
  }
</script>

<div
  class="p-3 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center transition-all duration-200 {player.isOnline === false 
    ? 'bg-gray-700 opacity-40 text-gray-500 cursor-not-allowed' 
    : 'bg-gray-700 hover:bg-gray-600 cursor-pointer'} {copySuccess ? 'ring-2 ring-green-500' : ''}"
  on:click={copyServerAddress}
  on:keydown={handleKeydown}
  role="button"
  tabindex="0"
  title={player.isOnline === false ? "玩家离线" : `点击复制服务器地址: ${player.serverAddr}`}
>
  <div class="flex-1">
    <p class="font-bold text-lg">{player.player}</p>
    <p class="text-sm text-gray-300">服务器：{player.server}</p>
    <p class="text-sm text-gray-300">地址：{player.serverAddr}</p>
    <p class="text-sm text-gray-300">地图：{player.map}</p>
    <!-- <p class="text-sm text-gray-300">得分：{player.score}</p> -->
    <!-- <p class="text-sm text-gray-300">皮肤：{player.skin}</p> -->
    <!-- <p class="text-sm text-gray-300">队伍：{player.team}</p> -->
    <p class="text-sm text-gray-300">挂机状态：{player.afk}</p>
  </div>
  
  <!-- 复制状态指示器 -->
  <div class="flex items-center gap-2 mt-2 sm:mt-0">
    {#if player.isOnline !== false && player.serverAddr && player.serverAddr !== "无"}
      <div class="flex items-center gap-1 text-xs text-gray-400">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
        </svg>
        <span>点击复制</span>
      </div>
    {/if}
    
    {#if copySuccess}
      <div class="flex items-center gap-1 text-xs text-green-400 animate-pulse">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span>已复制!</span>
      </div>
    {/if}
  </div>
</div>
