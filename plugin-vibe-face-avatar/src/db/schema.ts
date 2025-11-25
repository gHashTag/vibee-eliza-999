import { pgTable, uuid, bigint, varchar, text, timestamp, boolean, jsonb, index } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

/**
 * User Models Table (LoRA models trained on Fal.ai)
 * Stores information about users' trained avatar models
 */
export const userModels = pgTable('user_models', {
  id: uuid('id').primaryKey().defaultRandom(),
  telegram_id: bigint('telegram_id', { mode: 'number' }).notNull(),
  bot_name: varchar('bot_name', { length: 100 }).notNull().default('neuro_face_bot'),
  
  // Model info
  model_name: varchar('model_name', { length: 100 }).notNull(),
  model_url: text('model_url').notNull(), // URL to LoRA model on Fal.ai
  trigger_word: varchar('trigger_word', { length: 50 }).notNull(), // e.g., 'NEURO_SAGE'
  
  // Optional metadata
  gender: varchar('gender', { length: 10 }), // 'male' | 'female' | 'person'
  training_model: varchar('training_model', { length: 100 }), // e.g., 'flux-lora-fast-training'
  
  // Status
  status: varchar('status', { length: 20 }).notNull().default('training'), // 'training' | 'completed' | 'failed'
  is_active: boolean('is_active').notNull().default(true),
  
  // Flexible metadata (JSONB для дополнительной информации)
  metadata: jsonb('metadata').default({}),
  
  // Timestamps
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
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
  telegram_id: z.number().int().positive(),
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
