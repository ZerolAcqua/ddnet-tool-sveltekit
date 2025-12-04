<script lang="ts">
  import { page } from '$app/stores';
  import Navigation from '$lib/components/Navigation.svelte';

  $: status = $page.status;
  $: isClientError = status >= 400 && status < 500;
  $: isServerError = status >= 500;
</script>

<svelte:head>
  <title>错误 {status} - DDNet 工具集</title>
</svelte:head>

<div class="min-h-screen bg-gray-900">
  <Navigation />
  
  <main class="flex items-center justify-center p-4" style="min-height: calc(100vh - 4rem);">
    <div class="bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
      <!-- 状态码 -->
      <h1 class="text-9xl font-bold text-white mb-6 leading-none" style="font-size: 8rem;">
        {status}
      </h1>
      
      <!-- 简洁描述 -->
      <h2 class="text-2xl font-semibold text-gray-300 mb-8">
        {#if status === 404}
          页面未找到
        {:else if isClientError}
          请求错误
        {:else if isServerError}
          服务器错误
        {:else}
          出现错误
        {/if}
      </h2>
    </div>
  </main>
</div>

