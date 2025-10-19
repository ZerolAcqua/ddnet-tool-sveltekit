import { json, type RequestEvent } from '@sveltejs/kit';
import { deleteSession } from '$lib/server/auth';

export const POST = async ({ cookies }: RequestEvent) => {
  const sessionToken = cookies.get('session');
  
  if (sessionToken) {
    await deleteSession(sessionToken);
    cookies.delete('session', { path: '/' });
  }
  
  return json({ success: true, message: '已成功登出' });
};