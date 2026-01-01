<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import Navigation from '$lib/components/Navigation.svelte';
  
  // DDNet 地图数据接口
  interface DDNetMap {
    name: string;
    website: string;
    thumbnail: string;
    web_preview: string;
    type: string;
    points: number;
    difficulty: number;
    mapper: string;
    release: string;
    width?: number;
    height?: number;
    median_time?: number;
    first_finish?: string;
    timestamp?: number;
    tiles?: string[];
  }

  // 组件状态
  let maps: DDNetMap[] = [];
  let filteredMaps: DDNetMap[] = [];
  let loading = true;
  let error = '';
  
  // 筛选和搜索状态
  let searchQuery = '';
  let selectedType = 'all';
  let difficultyRange = [0, 5]; // DDNet 星级范围是 0-5
  let sortBy: 'name' | 'difficulty' | 'points' | 'release' = 'name';
  let sortOrder: 'asc' | 'desc' = 'asc';
  
  // 分页
  let currentPage = 1;
  let itemsPerPage = 24;
  let totalPages = 1;

  // 地图预览模态框
  let showMapPreview = false;
  let previewMap: DDNetMap | null = null;

  // 获取地图类型列表
  $: mapTypes = ['all', ...new Set(maps.map(map => map.type))];
  
  // 筛选逻辑
  $: {
    let filtered = maps.filter(map => {
      const matchesSearch = searchQuery === '' || 
        map.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        map.mapper.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = selectedType === 'all' || map.type === selectedType;
      
      // 处理可能交叉的难度范围
      const minDifficulty = Math.min(difficultyRange[0], difficultyRange[1]);
      const maxDifficulty = Math.max(difficultyRange[0], difficultyRange[1]);
      const matchesDifficulty = map.difficulty >= minDifficulty && 
        map.difficulty <= maxDifficulty;
      
      return matchesSearch && matchesType && matchesDifficulty;
    });
    
    // 排序
    filtered = filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'difficulty':
          comparison = a.difficulty - b.difficulty;
          break;
        case 'points':
          comparison = a.points - b.points;
          break;
        case 'release':
          comparison = new Date(a.release).getTime() - new Date(b.release).getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    filteredMaps = filtered;
    totalPages = Math.ceil(filteredMaps.length / itemsPerPage);
    
    // 重置到第一页
    if (currentPage > totalPages) {
      currentPage = 1;
    }
  }

  // 分页数据
  $: paginatedMaps = filteredMaps.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 获取地图数据
  async function loadMaps() {
    try {
      const response = await fetch('/api/maps');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      let result;
      const contentType = response.headers.get('content-type') ?? '未知类型';
      try {
        result = await response.json();
      } catch (parseError) {
        const detail = parseError instanceof Error ? parseError.message : String(parseError);
        throw new Error(`地图数据格式错误：期望 JSON 响应，实际为 ${contentType}，解析失败原因：${detail}`);
      }
      
      if (result.error) {
        throw new Error(result.message || result.error);
      }
      
      maps = result.data;
      console.log(`加载了 ${maps.length} 个地图 (来源: ${result.fromCache ? '缓存' : 'API'})`);
      
      // 如果有错误信息（比如API失败但使用了缓存），显示警告
      if (result.error && result.fromCache) {
        console.warn('注意：', result.error);
      }
    } catch (err) {
      console.error('加载地图数据失败:', err);
      error = err instanceof Error ? err.message : '加载失败';
    } finally {
      loading = false;
    }
  }

  // 难度显示样式
  function getDifficultyColor(difficulty: number): string {
    if (difficulty <= 1) return 'text-green-400 bg-green-900/30';
    if (difficulty <= 2) return 'text-blue-400 bg-blue-900/30';
    if (difficulty <= 3) return 'text-yellow-400 bg-yellow-900/30';
    if (difficulty <= 4) return 'text-orange-400 bg-orange-900/30';
    return 'text-red-400 bg-red-900/30';
  }

  // 格式化时间
  function formatTime(seconds: number): string {
    if (!seconds) return '未知';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // 分页导航
  function changePage(page: number) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
    }
  }

  // 地图预览功能
  function openMapPreview(map: DDNetMap) {
    previewMap = map;
    showMapPreview = true;
    // 禁用主页面滚动
    if (browser) {
      document.body.style.overflow = 'hidden';
    }
  }

  function closeMapPreview() {
    showMapPreview = false;
    previewMap = null;
    // 恢复主页面滚动
    if (browser) {
      document.body.style.overflow = 'auto';
    }
  }

  // 键盘事件处理
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && showMapPreview) {
      event.preventDefault();
      closeMapPreview();
    }
  }

  // 处理星星点击
  function handleStarClick(star: number) {
    // 如果点击的星在当前范围内，缩小范围
    if (star >= difficultyRange[0] && star <= difficultyRange[1]) {
      // 如果范围只有一个星，扩展到包含这个星
      if (difficultyRange[0] === difficultyRange[1]) {
        difficultyRange = [star, star];
      } else {
        // 缩小到点击的星
        difficultyRange = [star, star];
      }
    } else {
      // 扩展范围包含这个星
      const newMin = Math.min(difficultyRange[0], star);
      const newMax = Math.max(difficultyRange[1], star);
      difficultyRange = [newMin, newMax];
    }
  }

  onMount(() => {
    loadMaps();
  });

  onDestroy(() => {
    // 确保组件销毁时恢复滚动
    if (browser) {
      document.body.style.overflow = 'auto';
    }
  });
</script>

<svelte:head>
  <title>地图攻略 - DDNet 工具集</title>
  <meta name="description" content="浏览 DDNet 地图信息和攻略视频" />
  <style>
    /* 自定义滑块样式 */
    .slider-thumb {
      pointer-events: auto;
    }
    
    .slider-thumb::-webkit-slider-thumb {
      appearance: none;
      height: 20px;
      width: 20px;
      border-radius: 50%;
      background: #94a3b8;
      cursor: pointer;
      border: 2px solid #374151;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
      pointer-events: auto;
      position: relative;
      z-index: 2;
    }
    
    .slider-thumb::-moz-range-thumb {
      height: 20px;
      width: 20px;
      border-radius: 50%;
      background: #94a3b8;
      cursor: pointer;
      border: 2px solid #374151;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
      pointer-events: auto;
    }
    
    .slider-thumb::-webkit-slider-track {
      background: transparent;
    }
    
    .slider-thumb::-moz-range-track {
      background: transparent;
      border: none;
    }
    
    /* 确保滑块可以独立操作 */
    .slider-thumb:nth-of-type(1) {
      z-index: 3;
    }
    
    .slider-thumb:nth-of-type(2) {
      z-index: 2;
    }
  </style>
</svelte:head>

<svelte:window on:keydown={handleKeydown} />

<Navigation />

<div class="container mx-auto max-w-7xl px-6 py-8">
  <!-- 页面标题 -->
  <div class="card mb-6">
    <div>
      <h1 class="text-3xl font-bold text-white mb-2">DDNet 地图攻略</h1>
      <p class="text-gray-300">浏览 DDNet 地图信息，查找攻略视频，支持按难度筛选和搜索</p>
    </div>
  </div>

  {#if loading}
    <!-- 加载状态 -->
    <div class="min-h-[400px] flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p class="text-gray-300">加载地图数据中...</p>
      </div>
    </div>

  {:else if error}
    <!-- 错误状态 -->
    <div class="mb-6 p-3 bg-red-900/50 border border-red-500 rounded-lg">
      <div class="flex justify-between items-center">
        <p class="text-red-300 text-sm">加载失败: {error}</p>
        <button on:click={loadMaps} class="btn-secondary-sm">
          重试
        </button>
      </div>
    </div>

  {:else}
    <!-- 筛选和搜索区域 -->
    <div class="card mb-6">
      <h3 class="text-lg font-semibold mb-4 text-white">筛选和搜索</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- 搜索框 -->
        <div>
          <label for="search" class="block text-sm font-medium text-gray-300 mb-2">
            搜索地图/作者
          </label>
          <input
            id="search"
            type="text"
            placeholder="输入地图名或作者名..."
            class="input-field w-full"
            bind:value={searchQuery}
          />
        </div>
        
        <!-- 地图类型 -->
        <div>
          <label for="type" class="block text-sm font-medium text-gray-300 mb-2">
            地图类型
          </label>
          <select id="type" class="input-field w-full" bind:value={selectedType}>
            {#each mapTypes as type}
              <option value={type}>
                {type === 'all' ? '全部类型' : type}
              </option>
            {/each}
          </select>
        </div>
        
        <!-- 排序方式 -->
        <div>
          <label for="sort" class="block text-sm font-medium text-gray-300 mb-2">
            排序方式
          </label>
          <select id="sort" class="input-field w-full" bind:value={sortBy}>
            <option value="name">按名称</option>
            <option value="difficulty">按星级</option>
            <option value="points">按分数</option>
            <option value="release">按发布时间</option>
          </select>
        </div>
        
        <!-- 排序顺序 -->
        <div>
          <label for="order" class="block text-sm font-medium text-gray-300 mb-2">
            排序顺序
          </label>
          <select id="order" class="input-field w-full" bind:value={sortOrder}>
            <option value="asc">升序</option>
            <option value="desc">降序</option>
          </select>
        </div>
      </div>
      
      <!-- 星级范围选择器 -->
      <div class="mt-4">
        <div class="block text-sm font-medium text-gray-300 mb-3">
          星级范围: {Math.min(difficultyRange[0], difficultyRange[1])}★ - {Math.max(difficultyRange[0], difficultyRange[1])}★
        </div>
        
        <!-- 双端滑块 -->
        <div class="relative">
          <!-- 滑块轨道 -->
          <div class="relative h-2 bg-gray-700 rounded-full mb-4">
            <!-- 选中区域 -->
            <div 
              class="absolute h-2 bg-slate-400 rounded-full"
              style="left: {(Math.min(difficultyRange[0], difficultyRange[1]) / 5) * 100}%; width: {((Math.max(difficultyRange[0], difficultyRange[1]) - Math.min(difficultyRange[0], difficultyRange[1])) / 5) * 100}%"
            ></div>
          </div>
          
          <!-- 最低星级滑块 -->
          <div class="absolute -top-2 w-full">
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              class="w-full h-6 bg-transparent appearance-none cursor-pointer slider-thumb"
              bind:value={difficultyRange[0]}
              aria-label="最低星级"
            />
          </div>
          
          <!-- 最高星级滑块 -->
          <div class="absolute -top-2 w-full">
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              class="w-full h-6 bg-transparent appearance-none cursor-pointer slider-thumb"
              bind:value={difficultyRange[1]}
              aria-label="最高星级"
            />
          </div>
          
          <!-- 刻度标记 -->
          <div class="flex justify-between text-xs text-gray-500 mt-1">
            {#each Array(6) as _, i}
              <span>{i}★</span>
            {/each}
          </div>
        </div>
        
        <!-- 快速选择按钮 -->
        <div class="flex flex-wrap gap-2 mt-4">
          <button
            type="button"
            class="btn-secondary-sm"
            on:click={() => { difficultyRange = [0, 5]; }}
          >
            全部星级
          </button>
          <button
            type="button"
            class="btn-secondary-sm"
            on:click={() => { difficultyRange = [0, 2]; }}
          >
            低星 (0-2★)
          </button>
          <button
            type="button"
            class="btn-secondary-sm"
            on:click={() => { difficultyRange = [3, 4]; }}
          >
            中星 (3-4★)
          </button>
          <button
            type="button"
            class="btn-secondary-sm"
            on:click={() => { difficultyRange = [5, 5]; }}
          >
            高星 (5★)
          </button>
        </div>
      </div>
      
      <!-- 统计信息 -->
      <div class="mt-4 flex items-center justify-between text-sm text-gray-400">
        <span>
          显示 {filteredMaps.length} / {maps.length} 个地图
        </span>
        <span>
          第 {currentPage} 页，共 {totalPages} 页
        </span>
      </div>
    </div>

    <!-- 地图列表 -->
    {#if filteredMaps.length > 0}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {#each paginatedMaps as map}
          <div class="card hover:border-blue-500/50 transition-colors">
            <!-- 地图名称和难度信息 -->
            <div class="flex items-start justify-between mb-3">
              <h3 class="text-lg font-semibold text-white truncate flex-1">
                {map.name}
              </h3>
              <div class="ml-2 flex-shrink-0">
                <span class="px-2 py-1 text-sm rounded {getDifficultyColor(map.difficulty)} text-center inline-flex items-center gap-1">
                  <span class="text-sm opacity-75">{map.type}</span>
                  <span>{map.difficulty}★</span>
                  <span class="text-sm opacity-75">{map.points} pts</span>
                </span>
              </div>
            </div>
            
            <!-- 地图缩略图 -->
            <div class="w-full h-40 bg-gray-800 rounded-lg mb-3 overflow-hidden relative group">
              <img 
                src={map.thumbnail}
                alt="{map.name} 地图缩略图"
                class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                on:error={(e) => {
                  // 如果图片加载失败，显示占位符（仅在客户端）
                  if (browser && e.target) {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                      parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-500 text-sm">暂无缩略图</div>';
                    }
                  }
                }}
              />
              
              <!-- 悬浮操作按钮 -->
              <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                {#if map.website}
                  <a 
                    href={map.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                  >
                    查看详情
                  </a>
                {/if}
                {#if map.web_preview}
                  <button 
                    type="button"
                    on:click={() => openMapPreview(map)}
                    class="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors font-medium"
                  >
                    在线预览
                  </button>
                {/if}
              </div>
            </div>
            
            <!-- 地图信息 -->
            <div class="space-y-2 text-sm text-gray-400 mb-4">
              <div class="flex items-start">
                <span class="flex-shrink-0 mr-2">作者:</span>
                <span class="text-gray-300 truncate flex-1" title={map.mapper}>{map.mapper}</span>
              </div>
              <div class="flex items-start">
                <span class="flex-shrink-0 mr-2">发布:</span>
                <span class="text-gray-300">{new Date(map.release).toLocaleDateString('zh-CN')}</span>
              </div>
              {#if map.median_time}
                <div class="flex items-start">
                  <span class="flex-shrink-0 mr-2">平均用时:</span>
                  <span class="text-gray-300">{formatTime(map.median_time)}</span>
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
      
      <!-- 分页导航 -->
      {#if totalPages > 1}
        <div class="flex items-center justify-center gap-2">
          <button
            class="btn-secondary-sm"
            on:click={() => changePage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            上一页
          </button>
          
          {#each Array(Math.min(7, totalPages)) as _, i}
            {@const page = Math.max(1, Math.min(totalPages - 6, currentPage - 3)) + i}
            {#if page <= totalPages}
              <button
                class="{page === currentPage ? 'btn-primary-sm' : 'btn-secondary-sm'}"
                on:click={() => changePage(page)}
              >
                {page}
              </button>
            {/if}
          {/each}
          
          <button
            class="btn-secondary-sm"
            on:click={() => changePage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            下一页
          </button>
        </div>
      {/if}

    {:else}
      <!-- 没有结果 -->
      <div class="text-center py-12">
        <p class="text-gray-400 text-lg mb-4">没有找到符合条件的地图</p>
        <button 
          class="btn-secondary"
          on:click={() => {
            searchQuery = '';
            selectedType = 'all';
            difficultyRange = [0, 5];
          }}
        >
          清除筛选条件
        </button>
      </div>
    {/if}
  {/if}

  <!-- 返回工具列表 -->
  <div class="mt-8 text-center">
    <a href="/tools" class="text-gray-400 hover:text-white transition-colors">
      返回工具列表
    </a>
  </div>
</div>

<!-- 地图预览模态框 -->
{#if showMapPreview && previewMap}
  <!-- 背景遮罩 -->
  <div 
    class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
    on:click={closeMapPreview}
    on:keydown={(e) => e.key === 'Escape' && closeMapPreview()}
    on:wheel|preventDefault
    role="dialog"
    aria-modal="true"
    aria-labelledby="map-preview-title"
    tabindex="0"
  >
    <!-- 模态框内容 -->
    <div 
      class="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-6xl h-[80vh] flex flex-col mx-4"
      role="document"
    >
      <!-- 模态框头部 -->
      <div class="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 id="map-preview-title" class="text-xl font-semibold text-white">
          {previewMap.name} - 地图预览
        </h3>
        <button 
          type="button"
          on:click={closeMapPreview}
          class="text-gray-400 hover:text-white p-2 rounded transition-colors"
          aria-label="关闭预览"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <!-- iframe 内容区域 -->
      <div class="flex-1 p-4" role="presentation" on:click|stopPropagation on:keydown|stopPropagation>
        <iframe 
          src={previewMap.web_preview}
          class="w-full h-full border border-gray-600 rounded"
          title="{previewMap.name} 地图预览"
          loading="lazy"
          sandbox="allow-scripts allow-same-origin"
        ></iframe>
      </div>
      
      <!-- 模态框底部 -->
      <div class="p-4 border-t border-gray-700 flex justify-between items-center" role="presentation" on:click|stopPropagation>
        <div class="flex items-center gap-3">
          <span class="px-3 py-1 text-sm rounded {getDifficultyColor(previewMap.difficulty)} inline-flex items-center gap-1">
            <span class="text-sm opacity-75">{previewMap.type}</span>
            <span>{previewMap.difficulty}★</span>
            <span class="text-sm opacity-75">{previewMap.points} pts</span>
          </span>
        </div>
        <div class="flex gap-2">
          {#if previewMap.website}
            <a 
              href={previewMap.website} 
              target="_blank" 
              rel="noopener noreferrer"
              class="btn-secondary-sm"
            >
              查看详情
            </a>
          {/if}
          <button 
            type="button"
            on:click={closeMapPreview}
            class="btn-primary-sm"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}