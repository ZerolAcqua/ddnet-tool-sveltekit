import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { users, sessions } from './schema';
import { eq } from 'drizzle-orm';
import type { User } from './schema';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createUser(username: string, password: string, isAdmin = false): Promise<User> {
  const passwordHash = await hashPassword(password);
  
  const [user] = await db.insert(users).values({
    username,
    passwordHash,
    isAdmin,
  }).returning();
  
  return user;
}

export async function authenticateUser(username: string, password: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.username, username));
  
  if (!user) return null;
  
  const isValid = await verifyPassword(password, user.passwordHash);
  return isValid ? user : null;
}

export function generateSessionToken(): string {
  // 生成加密安全的随机令牌
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString('base64url');
}

export async function createSession(sessionToken: string, userId: string): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION);
  
  await db.insert(sessions).values({
    id: sessionToken,
    userId,
    expiresAt,
  });
  
  return sessionToken;
}

export async function verifySession(sessionId: string): Promise<User | null> {
  try {
    const [session] = await db.select().from(sessions)
      .where(eq(sessions.id, sessionId));
    
    if (!session || session.expiresAt < new Date()) {
      return null;
    }
    
    const [user] = await db.select().from(users)
      .where(eq(users.id, session.userId));
    
    return user || null;
  } catch {
    return null;
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}