<script>
  export let player;  // 玩家信息
</script>

<div class="p-3 bg-gray-700 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center">
  <div>
    <p class="font-bold text-lg">{player.player}</p>
    <p class="text-sm text-gray-300">服务器：{player.server}</p>
    <p class="text-sm text-gray-300">地图：{player.map}</p>
    <p class="text-sm text-gray-300">得分：{player.score}</p>
    <p class="text-sm text-gray-300">皮肤：{player.skin}</p>
    <p class="text-sm text-gray-300">队伍：{player.team}</p>
    <p class="text-sm text-gray-300">挂机状态：{player.afk}</p>
  </div>
</div>
