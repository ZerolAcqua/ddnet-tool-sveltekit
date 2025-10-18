<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { authState, initAuth } from '$lib/stores/auth';
  
  let { children, data } = $props();

  // 初始化认证状态
  onMount(() => {
    initAuth();
  });
</script>

<svelte:head>
  <title>DDNet 工具集</title>
  <meta name="description" content="专为 DDNet 玩家打造的实用工具平台" />
</svelte:head>

<div class="min-h-screen bg-gray-900">
  <main>
    {@render children?.()}
  </main>
</div>
