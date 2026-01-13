import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number; // 毫秒，0 表示不自动关闭
}

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([]);
  let idCounter = 0;

  const add = (message: string, type: ToastType = 'info', duration = 5000) => {
    const id = `toast-${++idCounter}`;
    update((toasts) => [...toasts, { id, message, type, duration }]);

    // 自动移除（如果设定了 duration）
    if (duration > 0) {
      setTimeout(() => {
        update((toasts) => toasts.filter((t) => t.id !== id));
      }, duration);
    }

    return id;
  };

  return {
    subscribe,
    add,
    remove: (id: string) => {
      update((toasts) => toasts.filter((t) => t.id !== id));
    },
    clear: () => {
      update(() => []);
    },
    success: (message: string, duration = 5000) => {
      return add(message, 'success', duration);
    },
    error: (message: string, duration = 5000) => {
      return add(message, 'error', duration);
    },
    warning: (message: string, duration = 5000) => {
      return add(message, 'warning', duration);
    },
    info: (message: string, duration = 5000) => {
      return add(message, 'info', duration);
    },
  };
}

export const toast = createToastStore();
