import { json, type RequestEvent } from '@sveltejs/kit';
import { verifySession } from '$lib/server/auth';

export const GET = async ({ cookies }: RequestEvent) => {
  const sessionToken = cookies.get('session');
  
  if (!sessionToken) {
    return json({ user: null, isAuthenticated: false });
  }
  
  const user = await verifySession(sessionToken);
  
  if (!user) {
    // 清除无效的 session cookie
    cookies.delete('session', { path: '/' });
    return json({ user: null, isAuthenticated: false });
  }
  
  return json({ 
    user: {
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt
    },
    isAuthenticated: true 
  });
};