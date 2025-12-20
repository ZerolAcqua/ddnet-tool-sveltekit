# 管理员认证测试指南

## 测试场景

### 1. 未登录用户访问管理页面
- 访问 `/admin` → 应该跳转到 `/login`
- 访问 `/admin/sync` → 应该跳转到 `/login`  
- 访问 `/admin/users` → 应该跳转到 `/login`

### 2. 普通用户访问管理页面
- 登录普通用户后访问 `/admin` → 应该跳转到首页 `/`
- 登录普通用户后访问 `/admin/sync` → 应该跳转到首页 `/`
- 登录普通用户后访问 `/admin/users` → 应该跳转到首页 `/`

### 3. 管理员用户访问管理页面
- 登录管理员后访问 `/admin` → 正常显示管理面板
- 登录管理员后访问 `/admin/sync` → 正常显示同步管理页面
- 登录管理员后访问 `/admin/users` → 正常显示用户管理页面

### 4. 登录态过期
- 管理员登录后等待会话过期
- 访问任何 `/admin/*` 页面 → 应该跳转到 `/login`
- 同步操作失败时 → 显示"请先登录"错误信息，按钮状态重置

## 验证点

✅ **统一认证守卫**：`/admin/+layout.ts` 为所有子路由提供认证
✅ **错误处理**：API 调用失败时正确重置 UI 状态  
✅ **用户体验**：认证失败时显示清晰的错误信息
✅ **安全性**：所有管理功能都需要管理员权限

## 当前配置

```typescript
// src/routes/admin/+layout.ts
import { createAdminLoader } from '$lib/client/auth-guards';

export const load = createAdminLoader();
```

这个配置确保：
1. 所有 `/admin/*` 路由都需要管理员权限
2. 未登录用户自动跳转到登录页面
3. 普通用户被重定向到首页
4. 管理员可以正常访问所有管理功能