import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/schema';
import { withAdminAuth } from '$lib/server/middleware';
import { eq } from 'drizzle-orm';

// 删除用户
export const DELETE = withAdminAuth(async ({ request, user: currentUser, params }) => {
  try {
    const targetUserId = params.id;
    if (!targetUserId) {
      return json({ success: false, message: '缺少用户ID' }, { status: 400 });
    }

    // 检查要删除的用户是否存在
    const targetUserResult = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
    if (targetUserResult.length === 0) {
      return json({ success: false, message: '用户不存在' }, { status: 404 });
    }

    const targetUser = targetUserResult[0];

    // 防止删除自己的账户
    if (targetUser.id === currentUser.id) {
      return json({ success: false, message: '不能删除自己的账户' }, { status: 400 });
    }

    // 防止删除其他管理员（可选的额外保护）
    if (targetUser.isAdmin) {
      return json({ success: false, message: '不能删除管理员账户' }, { status: 400 });
    }

    // 删除用户账户（cascade会自动删除相关数据）
    await db.delete(users).where(eq(users.id, targetUserId));

    return json({ 
      success: true, 
      message: `用户 "${targetUser.username}" 已成功删除` 
    });

  } catch (error) {
    console.error('删除用户失败:', error);
    return json({ success: false, message: '删除用户失败，请稍后重试' }, { status: 500 });
  }
});