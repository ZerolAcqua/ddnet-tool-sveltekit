<script lang="ts">
  import { onMount } from 'svelte';
  import { toast } from '$lib/stores/toast';
  import type { ToastType } from '$lib/stores/toast';

  export let message: string;
  export let type: ToastType = 'info';
  export let id: string;

  let isClosing = false;

  const typeConfig = {
    success: {
      bg: 'bg-emerald-950/50',
      border: 'border-emerald-800/60',
      text: 'text-emerald-300'
    },
    error: {
      bg: 'bg-red-950/50',
      border: 'border-red-800/60',
      text: 'text-red-300'
    },
    warning: {
      bg: 'bg-amber-950/50',
      border: 'border-amber-800/60',
      text: 'text-amber-300'
    },
    info: {
      bg: 'bg-blue-950/50',
      border: 'border-blue-800/60',
      text: 'text-blue-300'
    }
  };

  const config = typeConfig[type];

  function close() {
    isClosing = true;
    setTimeout(() => {
      toast.remove(id);
    }, 300);
  }

  onMount(() => {
    // 可选：添加自动关闭逻辑
    return () => {
      // cleanup
    };
  });
</script>

<div
  class="transform transition-all duration-300 ease-out pointer-events-auto {isClosing ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'}"
  role="alert"
>
  <div class="flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm {config.bg} {config.border}">
    <div class="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center flex-none">
      {#if type === 'success'}
        <svg class="w-4 h-4 {config.text}" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
      {:else if type === 'error'}
        <svg class="w-4 h-4 {config.text}" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
      {:else if type === 'warning'}
        <svg class="w-4 h-4 {config.text}" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
      {:else}
        <svg class="w-4 h-4 {config.text}" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
        </svg>
      {/if}
    </div>
    <div class="flex-1">
      <p class="text-sm font-medium {config.text}">{message}</p>
    </div>
    <button
      on:click={close}
      class="flex-shrink-0 text-gray-400 hover:text-gray-300 transition-colors"
      aria-label="关闭通知"
    >
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
    </button>
  </div>
</div>
