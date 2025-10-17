// 简单的前端账户系统实现
// 使用 localStorage 存储用户数据（生产环境应使用后端 + JWT）

export interface User {
  id: string;
  username: string;
  createdAt: string;
  isAdmin?: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

// 存储键名
const USERS_KEY = 'ddnet_users';
const CURRENT_USER_KEY = 'ddnet_current_user';

// 简单的密码哈希（仅用于演示，生产环境需要真正的加密）
function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return hash.toString(36);
}

// 生成用户ID
function generateUserId(): string {
  return 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// 获取所有用户
function getUsers(): Record<string, { user: User; passwordHash: string }> {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : {};
}

// 保存用户数据
function saveUsers(users: Record<string, { user: User; passwordHash: string }>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// 获取当前用户
export function getCurrentUser(): User | null {
  const data = localStorage.getItem(CURRENT_USER_KEY);
  return data ? JSON.parse(data) : null;
}

// 设置当前用户
function setCurrentUser(user: User | null) {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

// 用户注册
export function register(username: string, password: string): { success: boolean; message: string; user?: User } {
  // 验证输入
  if (!username.trim() || !password.trim()) {
    return { success: false, message: '用户名和密码都是必需的' };
  }

  if (password.length < 6) {
    return { success: false, message: '密码长度至少6位' };
  }

  const users = getUsers();
  
  // 检查用户名是否已存在
  for (const userData of Object.values(users)) {
    if (userData.user.username === username) {
      return { success: false, message: '用户名已存在' };
    }
  }

  // 创建新用户
  const user: User = {
    id: generateUserId(),
    username: username.trim(),
    createdAt: new Date().toISOString(),
    isAdmin: Object.keys(users).length === 0 // 第一个用户设为管理员
  };

  const passwordHash = simpleHash(password);
  users[user.id] = { user, passwordHash };
  
  saveUsers(users);
  setCurrentUser(user);

  return { success: true, message: '注册成功', user };
}

// 用户登录
export function login(username: string, password: string): { success: boolean; message: string; user?: User } {
  if (!username.trim() || !password.trim()) {
    return { success: false, message: '用户名和密码不能为空' };
  }

  const users = getUsers();
  const passwordHash = simpleHash(password);
  
  // 查找用户
  for (const userData of Object.values(users)) {
    const { user } = userData;
    if (user.username === username && userData.passwordHash === passwordHash) {
      setCurrentUser(user);
      return { success: true, message: '登录成功', user };
    }
  }

  return { success: false, message: '用户名或密码错误' };
}

// 用户登出
export function logout(): void {
  setCurrentUser(null);
}

// 检查是否已登录
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

// 获取认证状态
export function getAuthState(): AuthState {
  const user = getCurrentUser();
  return {
    user,
    isAuthenticated: user !== null
  };
}

// 更新用户信息
export function updateUser(updates: Partial<Pick<User, 'username'>>): { success: boolean; message: string; user?: User } {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return { success: false, message: '用户未登录' };
  }

  const users = getUsers();
  const userData = users[currentUser.id];
  if (!userData) {
    return { success: false, message: '用户不存在' };
  }

  // 检查用户名唯一性
  if (updates.username && updates.username !== currentUser.username) {
    for (const [id, data] of Object.entries(users)) {
      if (id !== currentUser.id && data.user.username === updates.username) {
        return { success: false, message: '用户名已存在' };
      }
    }
  }

  // 更新用户信息
  const updatedUser = { ...currentUser, ...updates };
  users[currentUser.id].user = updatedUser;
  
  saveUsers(users);
  setCurrentUser(updatedUser);

  return { success: true, message: '更新成功', user: updatedUser };
}

// 修改密码
export function changePassword(oldPassword: string, newPassword: string): { success: boolean; message: string } {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return { success: false, message: '用户未登录' };
  }

  if (!oldPassword.trim() || !newPassword.trim()) {
    return { success: false, message: '密码不能为空' };
  }

  if (newPassword.length < 6) {
    return { success: false, message: '新密码长度至少6位' };
  }

  const users = getUsers();
  const userData = users[currentUser.id];
  if (!userData) {
    return { success: false, message: '用户不存在' };
  }

  const oldPasswordHash = simpleHash(oldPassword);
  if (userData.passwordHash !== oldPasswordHash) {
    return { success: false, message: '原密码错误' };
  }

  // 更新密码
  userData.passwordHash = simpleHash(newPassword);
  saveUsers(users);

  return { success: true, message: '密码修改成功' };
}

// 删除账户
export function deleteAccount(password: string): { success: boolean; message: string } {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return { success: false, message: '用户未登录' };
  }

  const users = getUsers();
  const userData = users[currentUser.id];
  if (!userData) {
    return { success: false, message: '用户不存在' };
  }

  const passwordHash = simpleHash(password);
  if (userData.passwordHash !== passwordHash) {
    return { success: false, message: '密码错误' };
  }

  // 删除用户数据
  delete users[currentUser.id];
  saveUsers(users);
  logout();

  // 清除该用户的所有相关数据
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.includes(currentUser.id)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));

  return { success: true, message: '账户删除成功' };
}

// 获取所有用户（管理员功能）
export function getAllUsers(): User[] {
  const currentUser = getCurrentUser();
  if (!currentUser?.isAdmin) {
    return [];
  }

  const users = getUsers();
  return Object.values(users).map(data => data.user);
}