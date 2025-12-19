import { json } from '@sveltejs/kit';
import { optionalAuth, withAdminAuth } from '$lib/server/middleware';
import { isRegistrationDisabled, toggleRegistration } from '$lib/server/settings';

// 获取系统设置
export const GET = async (event) => {
  try {
    const user = await optionalAuth(event);
    
    // 所有用户都可以获取基本设置（如注册状态），但管理员可以获取详细信息
    if (user && user.isAdmin) {
      // 管理员可以获取完整的系统设置
      const settings = {
        registrationDisabled: await isRegistrationDisabled(),
        nodeEnv: process.env.NODE_ENV || 'development',
        port: process.env.PORT || '3000',
        host: process.env.HOST || '0.0.0.0'
      };

      return json({
        success: true,
        settings
      });
    } else {
      // 非管理员或匿名用户只能获取注册状态
      const settings = {
        registrationDisabled: await isRegistrationDisabled()
      };

      return json({
        success: true,
        settings
      });
    }

  } catch (error) {
    console.error('获取系统设置失败:', error);
    return json({ success: false, message: '获取设置失败' }, { status: 500 });
  }
};

// 更新系统设置
export const PUT = withAdminAuth(async ({ request, user }) => {
  try {
    const { setting, value } = await request.json();

    switch (setting) {
      case 'registrationDisabled':
        await toggleRegistration(value === true, user);
        break;
      default:
        return json({ success: false, message: '不支持的设置项' }, { status: 400 });
    }

    return json({
      success: true,
      message: '设置已更新'
    });

  } catch (error) {
    console.error('更新系统设置失败:', error);
    return json({ success: false, message: '更新失败' }, { status: 500 });
  }
});