<script lang="ts">
  import { register, login } from '../auth/auth';
  import type { User } from '../auth/auth';

  export let onLogin: (user: User) => void = () => {};

  let isLoginMode = true;
  let formData = {
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  };
  let message = '';
  let isLoading = false;

  function toggleMode() {
    isLoginMode = !isLoginMode;
    clearForm();
  }

  function clearForm() {
    formData = {
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    };
    message = '';
  }

  async function handleSubmit() {
    if (isLoading) return;
    
    message = '';
    isLoading = true;

    try {
      if (isLoginMode) {
        // 登录逻辑
        if (!formData.username.trim() || !formData.password.trim()) {
          message = '请填写用户名和密码';
          return;
        }

        const result = login(formData.username.trim(), formData.password);
        if (result.success && result.user) {
          onLogin(result.user);
          clearForm();
        } else {
          message = result.message;
        }
      } else {
        // 注册逻辑
        if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
          message = '请填写所有字段';
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          message = '两次输入的密码不一致';
          return;
        }

        const result = register(formData.username.trim(), formData.email.trim(), formData.password);
        if (result.success && result.user) {
          onLogin(result.user);
          clearForm();
        } else {
          message = result.message;
        }
      }
    } finally {
      isLoading = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleSubmit();
    }
  }
</script>

<div class="min-h-screen bg-gray-900 flex items-center justify-center p-4">
  <div class="bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md">
    <div class="text-center mb-8">
      <h2 class="text-xl font-semibold text-gray-300">
        {isLoginMode ? '用户登录' : '用户注册'}
      </h2>
    </div>

    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
      <!-- 用户名 -->
      <div>
        <label for="username" class="block text-sm font-medium text-gray-300 mb-2">
          {isLoginMode ? '用户名/邮箱' : '用户名'}
        </label>
        <input
          id="username"
          type="text"
          bind:value={formData.username}
          on:keydown={handleKeydown}
          placeholder={isLoginMode ? '输入用户名或邮箱' : '选择一个用户名'}
          class="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
          disabled={isLoading}
        />
      </div>

      <!-- 邮箱（仅注册时显示） -->
      {#if !isLoginMode}
        <div>
          <label for="email" class="block text-sm font-medium text-gray-300 mb-2">邮箱</label>
          <input
            id="email"
            type="email"
            bind:value={formData.email}
            on:keydown={handleKeydown}
            placeholder="输入你的邮箱"
            class="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
            disabled={isLoading}
          />
        </div>
      {/if}

      <!-- 密码 -->
      <div>
        <label for="password" class="block text-sm font-medium text-gray-300 mb-2">密码</label>
        <input
          id="password"
          type="password"
          bind:value={formData.password}
          on:keydown={handleKeydown}
          placeholder={isLoginMode ? '输入密码' : '至少6位密码'}
          class="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
          disabled={isLoading}
        />
      </div>

      <!-- 确认密码（仅注册时显示） -->
      {#if !isLoginMode}
        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-300 mb-2">确认密码</label>
          <input
            id="confirmPassword"
            type="password"
            bind:value={formData.confirmPassword}
            on:keydown={handleKeydown}
            placeholder="再次输入密码"
            class="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
            disabled={isLoading}
          />
        </div>
      {/if}

      <!-- 错误信息 -->
      {#if message}
        <div class="p-3 bg-red-900/50 border border-red-500 rounded-lg">
          <p class="text-red-300 text-sm">{message}</p>
        </div>
      {/if}

      <!-- 提交按钮 -->
      <button
        type="submit"
        disabled={isLoading}
        class="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? '处理中...' : (isLoginMode ? '登录' : '注册')}
      </button>
    </form>

    <!-- 切换模式 -->
    <div class="mt-6 text-center">
      <p class="text-gray-400">
        {isLoginMode ? '还没有账户？' : '已有账户？'}
        <button
          type="button"
          on:click={toggleMode}
          disabled={isLoading}
          class="text-blue-400 hover:text-blue-300 font-medium ml-1 disabled:opacity-50"
        >
          {isLoginMode ? '注册' : '登录'}
        </button>
      </p>
    </div>

    <!-- 说明信息 -->
    <div class="mt-6 p-4 bg-gray-700/50 rounded-lg">
      <p class="text-gray-400 text-sm">
        <strong>说明：</strong> 
        {#if isLoginMode}
          使用你的用户名或邮箱登录。忘记密码请联系管理员。
        {:else}
          第一个注册的用户将自动成为管理员。数据保存在本地浏览器中。
        {/if}
      </p>
    </div>
  </div>
</div>