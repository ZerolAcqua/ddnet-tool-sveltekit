<script lang="ts">
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
  class="p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center transition-all duration-200 {player.isOnline === false
    ? 'bg-gray-700 opacity-60 text-gray-400 cursor-not-allowed' 
    : 'bg-gray-700 hover:bg-gray-600 cursor-pointer'} {copySuccess ? 'ring-2 ring-green-500' : ''}"
  on:click={copyServerAddress}
  on:keydown={handleKeydown}
  role="button"
  tabindex="0"
  title={player.isOnline === false ? "玩家离线" : `点击复制服务器地址: ${player.serverAddr}`}
>
  <div class="flex-1">
    <!-- 玩家名和状态 -->
    <div class="flex items-center gap-2 mb-2">
      <p class="font-bold text-lg text-white">{player.player}</p>
      {#if player.isOnline !== false}
        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-900/50 text-green-300">
          <span class="w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></span>
          在线
        </span>
        {#if player.server && player.server !== '未知'}
          <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-900/50 text-blue-300">
            {player.server}
          </span>
        {/if}
      {:else}
        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-600 text-gray-400">
          <span class="w-1.5 h-1.5 bg-gray-500 rounded-full mr-1"></span>
          离线
        </span>
      {/if}
    </div>

    <!-- 详细信息 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm">
      <p class="text-gray-300">
        <span class="text-gray-400">服务器：</span>{player.server || '未知'}
      </p>
      <p class="text-gray-300">
        <span class="text-gray-400">地址：</span>{player.serverAddr || '未知'}
      </p>
      <p class="text-gray-300">
        <span class="text-gray-400">地图：</span>{player.map || '未知'}
      </p>
      <p class="text-gray-300">
        <span class="text-gray-400">挂机：</span>{player.afk === 'Yes' ? '是' : '否'}
      </p>
      {#if player.location}
        <p class="text-gray-300">
          <span class="text-gray-400">位置：</span>{player.location}
        </p>
      {/if}
    </div>
  </div>
  
  <!-- 右侧操作区域 -->
  <div class="flex items-center gap-2 mt-3 sm:mt-0 sm:ml-4">
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