<script lang="ts">
  import PlayerTracker from './components/PlayerTracker.svelte';
  import type { User } from '../../shared/auth/auth';

  export let user: User;
</script>

<div class="w-full">
  <div class="bg-gray-800 rounded-xl p-6 mb-6">
    <h2 class="text-2xl font-bold text-white mb-4">🎯 DDNet 玩家追踪器</h2>
    <p class="text-gray-300 mb-4">实时追踪你关心的 DDNet 玩家在线状态，支持上线通知和服务器信息查看。</p>
  </div>
  
  <PlayerTracker {user} />
</div>