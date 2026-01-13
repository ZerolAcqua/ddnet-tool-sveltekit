import { createAdminLoader } from '$lib/client/auth-guards';

// 为所有 /admin/* 路由提供统一的管理员认证
export const load = createAdminLoader();
