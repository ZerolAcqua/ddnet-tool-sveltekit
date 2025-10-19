import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
  try {
    // 预先获取注册状态
    const response = await fetch('/api/admin/settings');
    if (response.ok) {
      const data = await response.json();
      return {
        registrationDisabled: data.settings?.registrationDisabled || false
      };
    }
  } catch (error) {
    // 如果获取失败，默认允许注册
    console.error('预加载注册状态失败:', error);
  }
  
  return {
    registrationDisabled: false
  };
};