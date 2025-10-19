<script lang="ts">
  import type { PageData } from './$types';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  
  export let data: PageData;
  
  let isLoginMode = true;
  let formData = {
    username: '',
    password: '',
    confirmPassword: ''
  };
  let message = '';
  let isLoading = false;
  
  // 使用预加载的数据，无需客户端检查
  $: registrationDisabled = data.registrationDisabled;

  // 检查注册是否被禁用并自动切换到登录模式
  $: if (registrationDisabled && !isLoginMode) {
    isLoginMode = true;
    clearForm();
  }

  function toggleMode() {
    // 如果注册被禁用，不允许切换到注册模式
    if (!isLoginMode && registrationDisabled) {
      return;
    }
    
    isLoginMode = !isLoginMode;
    clearForm();
  }

  function clearForm() {
    formData = {
      username: '',
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

        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: formData.username.trim(),
            password: formData.password
          })
        });

        const result = await response.json();
        
        if (result.success) {
          clearForm();
          // 刷新认证状态，然后跳转
          if (browser) {
            const redirectTo = $page.url.searchParams.get('redirectTo') || '/';
            window.location.href = redirectTo;
          }
        } else {
          message = result.message;
        }
      } else {
        // 注册逻辑
        if (!formData.username.trim() || !formData.password.trim()) {
          message = '请填写用户名和密码';
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          message = '两次输入的密码不一致';
          return;
        }

        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: formData.username.trim(),
            password: formData.password
          })
        });

        const result = await response.json();
        
        if (result.success) {
          // 注册成功后自动登录
          try {
            const loginResponse = await fetch('/api/auth/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                username: formData.username.trim(),
                password: formData.password
              })
            });

            const loginResult = await loginResponse.json();
            
            if (loginResult.success) {
              clearForm();
              // 刷新认证状态
              if (browser) {
                const redirectTo = $page.url.searchParams.get('redirectTo') || '/';
                window.location.href = redirectTo;
              }
            } else {
              message = '注册成功，但自动登录失败，请手动登录';
            }
          } catch (error) {
            console.error('自动登录失败:', error);
            message = '注册成功，请手动登录';
          }
        } else {
          message = result.message;
        }
      }
    } catch (error) {
      console.error('操作失败:', error);
      message = '网络错误，请稍后重试';
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

<svelte:head>
  <title>{isLoginMode ? '登录' : '注册'} - DDNet 工具集</title>
</svelte:head>

<div class="min-h-screen bg-gray-900 flex items-center justify-center p-4">
  <div class="bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-white mb-2">DDNet 工具集</h1>
      <h2 class="text-xl font-semibold text-gray-300">
        {isLoginMode ? '用户登录' : '用户注册'}
      </h2>
    </div>

    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
      <!-- 用户名 -->
      <div>
        <label for="username" class="block text-sm font-medium text-gray-300 mb-2">
          用户名
        </label>
        <input
          id="username"
          type="text"
          bind:value={formData.username}
          on:keydown={handleKeydown}
          placeholder={isLoginMode ? '输入用户名' : '选择一个用户名'}
          class="input-field"
          disabled={isLoading}
          required
        />
      </div>

      <!-- 密码 -->
      <div>
        <label for="password" class="block text-sm font-medium text-gray-300 mb-2">密码</label>
        <input
          id="password"
          type="password"
          bind:value={formData.password}
          on:keydown={handleKeydown}
          placeholder={isLoginMode ? '输入密码' : '至少6位密码'}
          class="input-field"
          disabled={isLoading}
          required
          minlength={isLoginMode ? undefined : 6}
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
            class="input-field"
            disabled={isLoading}
            required
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
      <div class="pt-2">
        <button
          type="submit"
          disabled={isLoading}
          class="btn-primary w-full py-3"
        >
          {isLoading ? '处理中...' : (isLoginMode ? '登录' : '注册')}
        </button>
      </div>
    </form>

    <!-- 切换模式 -->
    {#if !registrationDisabled}
      <div class="mt-6 text-center">
        <p class="text-gray-400">
          {isLoginMode ? '还没有账户？' : '已有账户？'}
          <button
            type="button"
            on:click={toggleMode}
            disabled={isLoading}
            class="text-blue-400 hover:text-blue-300 font-medium ml-1 disabled:opacity-50 transition-colors"
          >
            {isLoginMode ? '注册' : '登录'}
          </button>
        </p>
      </div>
    {/if}

    <!-- 说明信息 -->
    <div class="mt-6 p-4 bg-gray-700/50 rounded-lg">
      <p class="text-gray-400 text-sm">
        <strong>说明：</strong> 
        {#if isLoginMode}
          使用你的用户名和密码登录。
        {:else if !registrationDisabled}
          第一个注册的用户将自动成为管理员。
        {/if}
      </p>
    </div>

    <!-- 返回首页链接 -->
    <div class="mt-4 text-center">
      <a href="/" class="text-gray-500 hover:text-gray-300 text-sm transition-colors">
        返回首页
      </a>
    </div>
  </div>
</div>