import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';

export const users = sqliteTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  isAdmin: integer('is_admin', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
});

export const maps = sqliteTable(
  'maps',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull().unique(),
    website: text('website'),
    thumbnail: text('thumbnail'),
    webPreview: text('web_preview'),
    type: text('type').notNull(),
    points: integer('points').notNull(),
    difficulty: integer('difficulty').notNull(),
    mapper: text('mapper').notNull(),
    release: text('release').notNull(),
    width: integer('width'),
    height: integer('height'),
    tiles: text('tiles'), // JSON string array
    medianTime: integer('median_time'),
    firstFinish: text('first_finish'),
    timestamp: integer('timestamp'),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  },
  (table) => ({
    nameIdx: index('map_name_idx').on(table.name),
    typeIdx: index('map_type_idx').on(table.type),
    difficultyIdx: index('map_difficulty_idx').on(table.difficulty),
    mapperIdx: index('map_mapper_idx').on(table.mapper),
  })
);

export const syncLog = sqliteTable('sync_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  source: text('source').notNull(), // 'ddnet_api'
  status: text('status').notNull(), // 'success', 'failed'
  recordCount: integer('record_count'),
  errorMessage: text('error_message'),
  syncedAt: integer('synced_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const trackedPlayers = sqliteTable('tracked_players', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  playerName: text('player_name').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  notificationEnabled: integer('notification_enabled', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const systemSettings = sqliteTable('system_settings', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedBy: text('updated_by').references(() => users.id),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type TrackedPlayer = typeof trackedPlayers.$inferSelect;
export type SystemSetting = typeof systemSettings.$inferSelect;
