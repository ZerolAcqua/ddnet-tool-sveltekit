import { db } from './db';
import { systemSettings } from './schema';
import { eq } from 'drizzle-orm';
import type { User } from './schema';

// 系统设置缓存
const settingsCache = new Map<string, string>();

// 设置键常量
export const SETTING_KEYS = {
  REGISTRATION_DISABLED: 'registration_disabled'
} as const;

// 获取设置值
export async function getSetting(key: string, defaultValue: string = ''): Promise<string> {
  // 先从缓存中获取
  if (settingsCache.has(key)) {
    return settingsCache.get(key)!;
  }

  try {
    const setting = await db.select().from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);

    const value = setting.length > 0 ? setting[0].value : defaultValue;
    
    // 更新缓存
    settingsCache.set(key, value);
    return value;
  } catch (error) {
    console.error('获取设置失败:', error);
    return defaultValue;
  }
}

// 设置值
export async function setSetting(key: string, value: string, userId?: string): Promise<void> {
  try {
    // 检查设置是否已存在
    const existing = await db.select().from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);

    if (existing.length > 0) {
      // 更新现有设置
      await db.update(systemSettings)
        .set({
          value,
          updatedAt: new Date(),
          updatedBy: userId
        })
        .where(eq(systemSettings.key, key));
    } else {
      // 创建新设置
      await db.insert(systemSettings).values({
        key,
        value,
        updatedBy: userId
      });
    }

    // 更新缓存
    settingsCache.set(key, value);
  } catch (error) {
    console.error('设置保存失败:', error);
    throw error;
  }
}

// 批量获取设置
export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  
  for (const key of keys) {
    result[key] = await getSetting(key);
  }
  
  return result;
}

// 检查注册是否被禁用
export async function isRegistrationDisabled(): Promise<boolean> {
  const value = await getSetting(SETTING_KEYS.REGISTRATION_DISABLED, 'false');
  return value === 'true';
}

// 切换注册状态
export async function toggleRegistration(disabled: boolean, user: User): Promise<void> {
  await setSetting(SETTING_KEYS.REGISTRATION_DISABLED, disabled.toString(), user.id);
}

// 清除缓存（用于测试或手动刷新）
export function clearSettingsCache(): void {
  settingsCache.clear();
}