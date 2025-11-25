import { pgTable, serial, varchar, bigint, text, timestamp, boolean, json, index } from 'drizzle-orm/pg-core';

/**
 * Пользователи VIBEE
 */
export const usersTable = pgTable('vibee_users', {
  id: serial('id').primaryKey(),
  telegram_id: bigint('telegram_id', { mode: 'number' }).unique().notNull(),
  username: varchar('username', { length: 255 }),
  first_name: varchar('first_name', { length: 255 }),
  last_name: varchar('last_name', { length: 255 }),
  photo_url: text('photo_url'),
  is_premium: boolean('is_premium').default(false).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  last_login_at: timestamp('last_login_at', { withTimezone: true }).defaultNow().notNull(),
  settings: json('settings').default('{}').notNull(),
  usage_stats: json('usage_stats').default('{}').notNull(),
}, (table) => ({
  telegramIdIdx: index('idx_users_telegram_id').on(table.telegram_id),
  createdAtIdx: index('idx_users_created_at').on(table.created_at),
}));

/**
 * Сессии пользователей
 */
export const userSessionsTable = pgTable('vibee_user_sessions', {
  id: serial('id').primaryKey(),
  user_id: bigint('user_id', { mode: 'number' }).notNull(),
  jwt_token: varchar('jwt_token', { length: 500 }).unique().notNull(),
  expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  last_used_at: timestamp('last_used_at', { withTimezone: true }).defaultNow().notNull(),
  ip_address: varchar('ip_address', { length: 50 }),
  user_agent: text('user_agent'),
  device_type: varchar('device_type', { length: 50 }),
}, (table) => ({
  userIdIdx: index('idx_sessions_user_id').on(table.user_id),
  jwtTokenIdx: index('idx_sessions_jwt_token').on(table.jwt_token),
  expiresIdx: index('idx_sessions_expires').on(table.expires_at),
}));

/**
 * Логи доступа к секретам
 */
export const secretAccessLogsTable = pgTable('vibee_secret_access_logs', {
  id: serial('id').primaryKey(),
  user_id: bigint('user_id', { mode: 'number' }).notNull(),
  secret_path: text('secret_path').notNull(),
  action: varchar('action', { length: 50 }).notNull(), // read, write, delete
  ip_address: varchar('ip_address', { length: 50 }),
  user_agent: text('user_agent'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('idx_secret_logs_user_id').on(table.user_id),
  createdAtIdx: index('idx_secret_logs_created_at').on(table.created_at),
}));

// Типы TypeScript
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type UserSession = typeof userSessionsTable.$inferSelect;
export type NewUserSession = typeof userSessionsTable.$inferInsert;
export type SecretAccessLog = typeof secretAccessLogsTable.$inferSelect;
export type NewSecretAccessLog = typeof secretAccessLogsTable.$inferInsert;
