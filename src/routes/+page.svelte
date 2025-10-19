<script lang="ts">
  import Navigation from '$lib/components/Navigation.svelte';
  import { authState } from '$lib/stores/auth';
  import { onMount } from 'svelte';
  import { initAuth } from '$lib/stores/auth';
  
  onMount(() => {
    initAuth();
  });
</script>

<svelte:head>
  <title>丘卡的 DDTools</title>
  <meta name="description" content="个人 DDNet 工具箱" />
</svelte:head>

<Navigation />

<div class="container mx-auto max-w-7xl px-6 py-8">
  <!-- 网站介绍 -->
  <div class="min-h-[70vh] flex items-center justify-center">
    <div class="text-center max-w-5xl mx-auto">
      <div class="mb-16">
        <h1 class="text-7xl font-bold text-white mb-6 tracking-tight">丘卡的 DDTools</h1>
        <p class="text-3xl text-gray-300 font-light mb-8">个人 DDNet 工具箱</p>
        <div class="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mb-12"></div>
        <p class="text-2xl text-gray-400 leading-relaxed max-w-3xl mx-auto">
          欢迎来到丘卡的 DDNet 工具箱！这里收集了一些我在 DDNet 游戏中用到的实用小工具。
          界面简洁，功能实用，专注于解决实际需求。
        </p>
      </div>
      
      <div class="text-lg text-gray-500">
        通过导航栏访问工具
      </div>
    </div>
  </div>


</div>
