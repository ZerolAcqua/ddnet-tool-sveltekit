<script lang="ts">
  import { logout, updateUser, changePassword, deleteAccount, getAllUsers } from '../auth/auth';
  import type { User } from '../auth/auth';

  export let user: User;
  export let onLogout: () => void = () => {};

  let showEditProfile = false;
  let showChangePassword = false;
  let showDeleteAccount = false;
  let showAdminPanel = false;

  // 编辑资料
  let editData = {
    username: user.username,
    email: user.email
  };
  let editMessage = '';

  // 修改密码
  let passwordData = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  let passwordMessage = '';

  // 删除账户
  let deletePassword = '';
  let deleteMessage = '';

  // 管理员面板
  let allUsers: User[] = [];

  function handleLogout() {
    logout();
    onLogout();
  }

  function resetEditForm() {
    editData = {
      username: user.username,
      email: user.email
    };
    editMessage = '';
  }

  function resetPasswordForm() {
    passwordData = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    passwordMessage = '';
  }

  function resetDeleteForm() {
    deletePassword = '';
    deleteMessage = '';
  }

  // 编辑资料
  function handleEditProfile() {
    editMessage = '';
    
    if (!editData.username.trim() || !editData.email.trim()) {
      editMessage = '用户名和邮箱不能为空';
      return;
    }

    if (!/\S+@\S+\.\S+/.test(editData.email)) {
      editMessage = '邮箱格式不正确';
      return;
    }

    const result = updateUser({
      username: editData.username.trim(),
      email: editData.email.trim()
    });

    if (result.success && result.user) {
      user = result.user;
      showEditProfile = false;
      editMessage = '';
    } else {
      editMessage = result.message;
    }
  }

  // 修改密码
  function handleChangePassword() {
    passwordMessage = '';

    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      passwordMessage = '请填写所有密码字段';
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      passwordMessage = '新密码确认不一致';
      return;
    }

    if (passwordData.newPassword.length < 6) {
      passwordMessage = '新密码长度至少6位';
      return;
    }

    const result = changePassword(passwordData.oldPassword, passwordData.newPassword);
    if (result.success) {
      showChangePassword = false;
      resetPasswordForm();
      alert('密码修改成功');
    } else {
      passwordMessage = result.message;
    }
  }

  // 删除账户
  function handleDeleteAccount() {
    deleteMessage = '';

    if (!deletePassword) {
      deleteMessage = '请输入密码确认';
      return;
    }

    if (!confirm('确定要删除账户吗？此操作不可恢复，所有数据将被清除。')) {
      return;
    }

    const result = deleteAccount(deletePassword);
    if (result.success) {
      alert('账户已删除');
      onLogout();
    } else {
      deleteMessage = result.message;
    }
  }

  // 加载所有用户（管理员功能）
  function loadAllUsers() {
    allUsers = getAllUsers();
  }

  // 切换管理员面板
  function toggleAdminPanel() {
    showAdminPanel = !showAdminPanel;
    if (showAdminPanel && user.isAdmin) {
      loadAllUsers();
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('zh-CN');
  }
</script>

<div class="bg-gray-800 rounded-xl p-6 mb-6">
  <div class="flex items-center justify-between mb-4">
    <div>
      <h3 class="text-xl font-semibold text-white flex items-center gap-2">
        欢迎，{user.username}
        {#if user.isAdmin}
          <span class="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">管理员</span>
        {/if}
      </h3>
      <p class="text-gray-400 text-sm">注册时间：{formatDate(user.createdAt)}</p>
    </div>
    <div class="flex gap-2">
      <button
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        on:click={() => {
          import('../router').then(({ navigate }) => navigate('/profile'));
        }}
      >
        个人资料
      </button>
      {#if user.isAdmin}
        <button
          class="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          on:click={() => {
            import('../router').then(({ navigate }) => navigate('/admin'));
          }}
        >
          管理面板
        </button>
      {/if}
      <button
        class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
        on:click={() => showEditProfile = !showEditProfile}
      >
        快速设置
      </button>
      <button
        class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        on:click={handleLogout}
      >
        退出登录
      </button>
    </div>
  </div>

  <!-- 账户设置面板 -->
  {#if showEditProfile}
    <div class="bg-gray-700 rounded-lg p-4 mb-4">
      <h4 class="text-lg font-medium text-white mb-4">账户设置</h4>
      
      <div class="space-y-4 mb-4">
        <!-- 编辑资料按钮 -->
        <button
          class="w-full text-left px-4 py-3 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
          on:click={() => {
            showChangePassword = false;
            showDeleteAccount = false;
            resetEditForm();
          }}
        >
          📝 编辑个人资料
        </button>

        <!-- 修改密码按钮 -->
        <button
          class="w-full text-left px-4 py-3 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
          on:click={() => {
            showChangePassword = true;
            showDeleteAccount = false;
            resetPasswordForm();
          }}
        >
          🔐 修改密码
        </button>

        <!-- 删除账户按钮 -->
        <button
          class="w-full text-left px-4 py-3 bg-red-700 text-white rounded hover:bg-red-600 transition-colors"
          on:click={() => {
            showDeleteAccount = true;
            showChangePassword = false;
            resetDeleteForm();
          }}
        >
          🗑️ 删除账户
        </button>
      </div>

      <!-- 编辑个人资料表单 -->
      {#if !showChangePassword && !showDeleteAccount}
        <div class="space-y-4">
          <div>
            <label for="edit-username" class="block text-sm font-medium text-gray-300 mb-2">用户名</label>
            <input
              id="edit-username"
              type="text"
              bind:value={editData.username}
              class="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
              placeholder="输入新用户名"
            />
          </div>
          <div>
            <label for="edit-email" class="block text-sm font-medium text-gray-300 mb-2">邮箱</label>
            <input
              id="edit-email"
              type="email"
              bind:value={editData.email}
              class="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
              placeholder="输入新邮箱"
            />
          </div>
          {#if editMessage}
            <p class="text-red-400 text-sm">{editMessage}</p>
          {/if}
          <div class="flex gap-2">
            <button
              class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              on:click={handleEditProfile}
            >
              保存修改
            </button>
            <button
              class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              on:click={resetEditForm}
            >
              重置
            </button>
          </div>
        </div>
      {/if}

      <!-- 修改密码表单 -->
      {#if showChangePassword}
        <div class="space-y-4">
          <div>
            <label for="old-password" class="block text-sm font-medium text-gray-300 mb-2">当前密码</label>
            <input
              id="old-password"
              type="password"
              bind:value={passwordData.oldPassword}
              class="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
              placeholder="输入当前密码"
            />
          </div>
          <div>
            <label for="new-password" class="block text-sm font-medium text-gray-300 mb-2">新密码</label>
            <input
              id="new-password"
              type="password"
              bind:value={passwordData.newPassword}
              class="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
              placeholder="输入新密码（至少6位）"
            />
          </div>
          <div>
            <label for="confirm-password" class="block text-sm font-medium text-gray-300 mb-2">确认新密码</label>
            <input
              id="confirm-password"
              type="password"
              bind:value={passwordData.confirmPassword}
              class="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
              placeholder="再次输入新密码"
            />
          </div>
          {#if passwordMessage}
            <p class="text-red-400 text-sm">{passwordMessage}</p>
          {/if}
          <div class="flex gap-2">
            <button
              class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              on:click={handleChangePassword}
            >
              修改密码
            </button>
            <button
              class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              on:click={() => showChangePassword = false}
            >
              取消
            </button>
          </div>
        </div>
      {/if}

      <!-- 删除账户表单 -->
      {#if showDeleteAccount}
        <div class="space-y-4 border-l-4 border-red-500 pl-4">
          <div class="text-red-400">
            <h5 class="font-medium mb-2">⚠️ 危险操作</h5>
            <p class="text-sm mb-4">删除账户将永久清除你的所有数据，包括玩家列表、设置等。此操作不可恢复！</p>
          </div>
          <div>
            <label for="delete-password" class="block text-sm font-medium text-gray-300 mb-2">输入密码确认删除</label>
            <input
              id="delete-password"
              type="password"
              bind:value={deletePassword}
              class="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-red-500 focus:outline-none"
              placeholder="输入密码确认删除"
            />
          </div>
          {#if deleteMessage}
            <p class="text-red-400 text-sm">{deleteMessage}</p>
          {/if}
          <div class="flex gap-2">
            <button
              class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              on:click={handleDeleteAccount}
            >
              确认删除账户
            </button>
            <button
              class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              on:click={() => showDeleteAccount = false}
            >
              取消
            </button>
          </div>
        </div>
      {/if}
    </div>
  {/if}

  <!-- 管理员面板 -->
  {#if showAdminPanel && user.isAdmin}
    <div class="bg-gray-700 rounded-lg p-4">
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-lg font-medium text-white">👑 管理员面板</h4>
        <button
          class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          on:click={loadAllUsers}
        >
          刷新用户列表
        </button>
      </div>
      
      {#if allUsers.length > 0}
        <div class="space-y-3">
          <div class="text-sm text-gray-300 mb-2">
            系统用户总数：{allUsers.length}
          </div>
          {#each allUsers as userItem (userItem.id)}
            <div class="bg-gray-600 rounded p-3 flex items-center justify-between">
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-medium text-white">{userItem.username}</span>
                  {#if userItem.isAdmin}
                    <span class="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">管理员</span>
                  {/if}
                  {#if userItem.id === user.id}
                    <span class="bg-green-600 text-white text-xs px-2 py-1 rounded-full">当前用户</span>
                  {/if}
                </div>
                <div class="text-sm text-gray-300">
                  {userItem.email} • 注册于 {formatDate(userItem.createdAt)}
                </div>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-gray-400">暂无用户数据</p>
      {/if}
    </div>
  {/if}
</div>