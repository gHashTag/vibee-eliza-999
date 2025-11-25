import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { sql } from 'drizzle-orm';

/**
 * User Models Table (LoRA models trained on Fal.ai) - SQLite version
 * Stores information about users' trained avatar models
 */
export const userModels = sqliteTable('user_models', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  telegram_id: integer('telegram_id').notNull(),
  bot_name: text('bot_name').notNull().default('neuro_face_bot'),
  
  // Model info
  model_name: text('model_name').notNull(),
  model_url: text('model_url').notNull(), // URL to LoRA model on Fal.ai
  trigger_word: text('trigger_word').notNull(), // e.g., 'NEURO_SAGE'
  
  // Optional metadata
  gender: text('gender'), // 'male' | 'female' | 'person'
  training_model: text('training_model'), // e.g., 'flux-lora-fast-training'
  
  // Status
  status: text('status').notNull().default('training'), // 'training' | 'completed' | 'failed'
  is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  
  // Flexible metadata (TEXT для JSON в SQLite)
  metadata: text('metadata', { mode: 'json' }).default('{}'),
  
  // Timestamps
  created_at: text('created_at')
    .default(sql`(datetime('now'))`),
  updated_at: text('updated_at')
    .default(sql`(datetime('now'))`),
}, (table) => ({
  // Индексы для быстрого поиска
  telegramIdIdx: index('idx_user_models_telegram_id').on(table.telegram_id),
  botNameIdx: index('idx_user_models_bot_name').on(table.bot_name),
  statusIdx: index('idx_user_models_status').on(table.status),
  isActiveIdx: index('idx_user_models_is_active').on(table.is_active),
  compositeIdx: index('idx_user_models_telegram_bot').on(table.telegram_id, table.bot_name),
}));

// Zod schemas for validation
export const insertUserModelSchema = createInsertSchema(userModels, {
  telegram_id: z.number().int(),
  bot_name: z.string().min(1).max(100),
  model_name: z.string().min(1).max(100),
  model_url: z.string().url(),
  trigger_word: z.string().min(1).max(50),
  gender: z.enum(['male', 'female', 'person']).optional(),
  status: z.enum(['training', 'completed', 'failed']),
  is_active: z.boolean().default(true),
  metadata: z.record(z.unknown()).default({}),
});

export const selectUserModelSchema = createSelectSchema(userModels);

// TypeScript types
export type InsertUserModel = z.infer<typeof insertUserModelSchema>;
export type SelectUserModel = z.infer<typeof selectUserModelSchema>;
export type UserModel = typeof userModels.$inferSelect;
