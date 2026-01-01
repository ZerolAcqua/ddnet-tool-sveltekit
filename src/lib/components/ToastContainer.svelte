<script lang="ts">
  import { toast } from '$lib/stores/toast';
  import Toast from '$lib/components/Toast.svelte';
</script>

<!-- 用于宣读普通通知的 ARIA Live Region -->
<div 
  class="fixed top-0 left-0 right-0 z-50 pointer-events-none" 
  role="status" 
  aria-live="polite"
  aria-label="系统通知"
>
  <div class="flex flex-col items-center gap-2 pt-4 px-4">
    {#each $toast as t (t.id)}
      {#if t.type !== 'error'}
        <Toast message={t.message} type={t.type} id={t.id} />
      {/if}
    {/each}
  </div>
</div>

<!-- 用于宣读错误通知的 ARIA Live Region (assertive) -->
<div 
  class="fixed top-0 left-0 right-0 z-50 pointer-events-none" 
  role="alert"
  aria-live="assertive"
  aria-label="错误提示"
>
  <div class="flex flex-col items-center gap-2 pt-4 px-4">
    {#each $toast as t (t.id)}
      {#if t.type === 'error'}
        <Toast message={t.message} type={t.type} id={t.id} />
      {/if}
    {/each}
  </div>
</div>
