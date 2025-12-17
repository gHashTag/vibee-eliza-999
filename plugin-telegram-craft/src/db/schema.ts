/**
 * Drizzle ORM Schema for Chat Configs and Knowledge System
 * Схема базы данных для системы конфигураций чатов и RAG
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  jsonb,
  index,
  integer,
  real,
  customType,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import type { StyleRules, SalesConfig, KnowledgeSource, ResponseExample } from '../types/chatConfig.types';
import type { ChunkMetadata } from '../types/knowledge.types';

/**
 * Custom type for pgvector (768 dimensions for Ollama nomic-embed-text)
 */
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(768)';
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string): number[] {
    // Parse PostgreSQL vector format: [0.1,0.2,...]
    const cleaned = value.replace(/[\[\]]/g, '');
    return cleaned.split(',').map(Number);
  },
});

// ============================================
// CHAT CONFIGS TABLE
// ============================================

/**
 * Таблица конфигураций чатов
 * Хранит настройки для каждого целевого чата
 */
export const chatConfigs = pgTable('chat_configs', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Идентификация чата
  chatId: varchar('chat_id', { length: 50 }).notNull().unique(),
  tgChatTitle: varchar('tg_chat_title', { length: 255 }),
  chatType: varchar('chat_type', { length: 20 }).notNull().default('group'),

  // Persona
  personaName: varchar('persona_name', { length: 100 }).notNull(),
  systemPrompt: text('system_prompt').notNull(),
  styleRules: jsonb('style_rules').$type<StyleRules>().notNull(),
  responseExamples: jsonb('response_examples').$type<ResponseExample[]>().default([]),

  // Knowledge Sources (JSON array)
  knowledgeSources: jsonb('knowledge_sources').$type<KnowledgeSource[]>().default([]),

  // Triggers
  triggerWords: text('trigger_words').array(),
  responseProbability: real('response_probability').notNull().default(1.0),
  requireMention: boolean('require_mention').notNull().default(false),

  // Sales
  salesMode: boolean('sales_mode').notNull().default(false),
  salesConfig: jsonb('sales_config').$type<SalesConfig>(),

  // Status
  isActive: boolean('is_active').notNull().default(true),
  priority: integer('priority').notNull().default(0),

  // Metadata
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  createdBy: varchar('created_by', { length: 100 }),
}, (table) => ({
  chatIdIdx: index('idx_chat_configs_chat_id').on(table.chatId),
  isActiveIdx: index('idx_chat_configs_is_active').on(table.isActive),
  personaIdx: index('idx_chat_configs_persona').on(table.personaName),
  priorityIdx: index('idx_chat_configs_priority').on(table.priority),
}));

// ============================================
// KNOWLEDGE SOURCES TABLE
// ============================================

/**
 * Таблица источников знаний
 * Детальная информация о каждом источнике для RAG
 */
export const knowledgeSources = pgTable('knowledge_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatConfigId: uuid('chat_config_id').references(() => chatConfigs.id, { onDelete: 'cascade' }),

  // Source info
  sourceType: varchar('source_type', { length: 20 }).notNull(),
  sourcePath: text('source_path').notNull(),
  sourceName: varchar('source_name', { length: 255 }),

  // Processing status
  isProcessed: boolean('is_processed').notNull().default(false),
  lastProcessedAt: timestamp('last_processed_at', { withTimezone: true }),
  chunkCount: integer('chunk_count').notNull().default(0),

  // Metadata
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  chatConfigIdIdx: index('idx_knowledge_sources_chat_config').on(table.chatConfigId),
  sourceTypeIdx: index('idx_knowledge_sources_type').on(table.sourceType),
  isProcessedIdx: index('idx_knowledge_sources_processed').on(table.isProcessed),
}));

// ============================================
// KNOWLEDGE CHUNKS TABLE (with pgvector)
// ============================================

/**
 * Таблица чанков знаний для RAG
 * Хранит разбитый контент с embeddings для vector search
 */
export const knowledgeChunks = pgTable('knowledge_chunks', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceId: uuid('source_id').references(() => knowledgeSources.id, { onDelete: 'cascade' }),
  chatConfigId: uuid('chat_config_id').references(() => chatConfigs.id, { onDelete: 'cascade' }),

  // Content
  content: text('content').notNull(),
  embedding: vector('embedding'),

  // Metadata
  chunkType: varchar('chunk_type', { length: 20 }),
  chapter: varchar('chapter', { length: 255 }),
  title: varchar('title', { length: 255 }),
  tags: text('tags').array(),
  position: integer('position'),
  metadata: jsonb('metadata').$type<ChunkMetadata>(),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  sourceIdIdx: index('idx_knowledge_chunks_source').on(table.sourceId),
  chatConfigIdIdx: index('idx_knowledge_chunks_chat_config').on(table.chatConfigId),
  chunkTypeIdx: index('idx_knowledge_chunks_type').on(table.chunkType),
  // pgvector index создается отдельной миграцией:
  // CREATE INDEX idx_knowledge_chunks_embedding ON knowledge_chunks
  //   USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
}));

// ============================================
// CHAT MESSAGES LOG TABLE (Analytics)
// ============================================

/**
 * Таблица логов сообщений для аналитики
 */
export const chatMessagesLog = pgTable('chat_messages_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatConfigId: uuid('chat_config_id').references(() => chatConfigs.id),

  // Telegram message info
  telegramMessageId: varchar('telegram_message_id', { length: 50 }),
  chatId: varchar('chat_id', { length: 50 }).notNull(),
  fromUserId: varchar('from_user_id', { length: 50 }),
  fromUsername: varchar('from_username', { length: 100 }),
  fromFirstName: varchar('from_first_name', { length: 100 }),

  // Content
  messageText: text('message_text'),
  botResponse: text('bot_response'),

  // Analytics
  triggersMatched: text('triggers_matched').array(),
  knowledgeChunksUsed: uuid('knowledge_chunks_used').array(),
  responseTimeMs: integer('response_time_ms'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  chatIdIdx: index('idx_chat_messages_log_chat').on(table.chatId),
  createdAtIdx: index('idx_chat_messages_log_created').on(table.createdAt),
  chatConfigIdIdx: index('idx_chat_messages_log_config').on(table.chatConfigId),
}));

// ============================================
// TELEGRAM USER ACCOUNTS TABLE
// ============================================

/**
 * Таблица аккаунтов пользователей Telegram
 * Хранит session strings для userbot авторизации каждого пользователя
 */
export const telegramUserAccounts = pgTable('telegram_user_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),

  // User identification
  telegramUserId: varchar('telegram_user_id', { length: 50 }).notNull().unique(),
  elizaUserId: varchar('eliza_user_id', { length: 100 }),
  chatId: varchar('chat_id', { length: 50 }),  // Чат где произошла авторизация

  // Auth data
  phone: varchar('phone', { length: 20 }).notNull(),
  sessionString: text('session_string').notNull(),  // Зашифрованный session string

  // User info from Telegram
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  username: varchar('username', { length: 100 }),

  // Status
  isActive: boolean('is_active').notNull().default(true),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),

  // Metadata
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  telegramUserIdIdx: index('idx_telegram_user_accounts_tg_user').on(table.telegramUserId),
  chatIdIdx: index('idx_telegram_user_accounts_chat').on(table.chatId),
  isActiveIdx: index('idx_telegram_user_accounts_active').on(table.isActive),
}));

// ============================================
// TELEGRAM AUTH SESSIONS TABLE (temporary)
// ============================================

/**
 * Таблица временных сессий авторизации
 * Хранит состояние процесса авторизации (запрос кода, ожидание 2FA и т.д.)
 */
export const telegramAuthSessions = pgTable('telegram_auth_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Session identification
  chatId: varchar('chat_id', { length: 50 }).notNull(),
  telegramUserId: varchar('telegram_user_id', { length: 50 }),

  // Auth state
  phone: varchar('phone', { length: 20 }).notNull(),
  phoneCodeHash: varchar('phone_code_hash', { length: 255 }),
  authState: varchar('auth_state', { length: 20 }).notNull().default('pending_code'),
  // States: pending_code, pending_2fa, completed, expired, failed

  // Attempts tracking
  codeAttempts: integer('code_attempts').notNull().default(0),
  maxAttempts: integer('max_attempts').notNull().default(3),

  // Expiration
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  chatIdIdx: index('idx_telegram_auth_sessions_chat').on(table.chatId),
  authStateIdx: index('idx_telegram_auth_sessions_state').on(table.authState),
  expiresAtIdx: index('idx_telegram_auth_sessions_expires').on(table.expiresAt),
}));

// ============================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================

// StyleRules schema
const styleRulesSchema = z.object({
  adjectives: z.array(z.string()),
  slangs: z.array(z.string()),
  emojisAllowed: z.boolean(),
  language: z.enum(['ru', 'en', 'mixed']),
  maxResponseLength: z.number().int().positive(),
  formality: z.enum(['casual', 'professional', 'mixed']),
});

// SalesConfig schema
const salesConfigSchema = z.object({
  productName: z.string(),
  price: z.string(),
  ctaTemplate: z.string(),
  objectionHandlers: z.record(z.string(), z.string()),
  mentorContact: z.string(),
  urgencyTriggers: z.array(z.string()),
  features: z.array(z.string()),
  competitorComparison: z.record(z.string(), z.string()).optional(),
});

// KnowledgeSource schema
const knowledgeSourceSchema = z.object({
  type: z.enum(['md_directory', 'pdf_file', 'pdf_url', 'web_url', 'json']),
  path: z.string(),
  name: z.string(),
  isProcessed: z.boolean().optional(),
  chunkCount: z.number().optional(),
  lastProcessedAt: z.date().optional(),
});

// ResponseExample schema
const responseExampleSchema = z.object({
  userMessage: z.string(),
  botResponse: z.string(),
  context: z.string().optional(),
});

// Chat Config insert schema
export const insertChatConfigSchema = createInsertSchema(chatConfigs, {
  chatId: z.string().min(1).max(50),
  tgChatTitle: z.string().max(255).optional(),
  chatType: z.enum(['group', 'supergroup', 'channel', 'private']),
  personaName: z.string().min(1).max(100),
  systemPrompt: z.string().min(1),
  styleRules: styleRulesSchema,
  responseExamples: z.array(responseExampleSchema).optional(),
  knowledgeSources: z.array(knowledgeSourceSchema).optional(),
  triggerWords: z.array(z.string()).optional(),
  responseProbability: z.number().min(0).max(1),
  requireMention: z.boolean(),
  salesMode: z.boolean(),
  salesConfig: salesConfigSchema.optional(),
  isActive: z.boolean(),
  priority: z.number().int(),
});

export const selectChatConfigSchema = createSelectSchema(chatConfigs);

// Knowledge Source insert schema
export const insertKnowledgeSourceSchema = createInsertSchema(knowledgeSources, {
  sourceType: z.enum(['md_directory', 'pdf_file', 'pdf_url', 'web_url', 'json']),
  sourcePath: z.string().min(1),
  sourceName: z.string().max(255).optional(),
});

export const selectKnowledgeSourceSchema = createSelectSchema(knowledgeSources);

// Knowledge Chunk insert schema
export const insertKnowledgeChunkSchema = createInsertSchema(knowledgeChunks, {
  content: z.string().min(1),
  chunkType: z.enum(['concept', 'tip', 'example', 'question', 'sales', 'faq', 'general']).optional(),
  chapter: z.string().max(255).optional(),
  title: z.string().max(255).optional(),
  tags: z.array(z.string()).optional(),
  position: z.number().int().optional(),
});

export const selectKnowledgeChunkSchema = createSelectSchema(knowledgeChunks);

// Chat Messages Log insert schema
export const insertChatMessagesLogSchema = createInsertSchema(chatMessagesLog);
export const selectChatMessagesLogSchema = createSelectSchema(chatMessagesLog);

// ============================================
// TYPESCRIPT TYPES
// ============================================

export type InsertChatConfig = z.infer<typeof insertChatConfigSchema>;
export type SelectChatConfig = z.infer<typeof selectChatConfigSchema>;
export type ChatConfigRecord = typeof chatConfigs.$inferSelect;

export type InsertKnowledgeSource = z.infer<typeof insertKnowledgeSourceSchema>;
export type SelectKnowledgeSource = z.infer<typeof selectKnowledgeSourceSchema>;
export type KnowledgeSourceRecord = typeof knowledgeSources.$inferSelect;

export type InsertKnowledgeChunk = z.infer<typeof insertKnowledgeChunkSchema>;
export type SelectKnowledgeChunk = z.infer<typeof selectKnowledgeChunkSchema>;
export type KnowledgeChunkRecord = typeof knowledgeChunks.$inferSelect;

export type InsertChatMessagesLog = z.infer<typeof insertChatMessagesLogSchema>;
export type SelectChatMessagesLog = z.infer<typeof selectChatMessagesLogSchema>;
export type ChatMessagesLogRecord = typeof chatMessagesLog.$inferSelect;

// Telegram User Accounts schemas and types
export const insertTelegramUserAccountSchema = createInsertSchema(telegramUserAccounts, {
  telegramUserId: z.string().min(1).max(50),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/),
  sessionString: z.string().min(1),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  username: z.string().max(100).optional(),
});
export const selectTelegramUserAccountSchema = createSelectSchema(telegramUserAccounts);
export type InsertTelegramUserAccount = z.infer<typeof insertTelegramUserAccountSchema>;
export type SelectTelegramUserAccount = z.infer<typeof selectTelegramUserAccountSchema>;
export type TelegramUserAccountRecord = typeof telegramUserAccounts.$inferSelect;

// Telegram Auth Sessions schemas and types
export const insertTelegramAuthSessionSchema = createInsertSchema(telegramAuthSessions, {
  chatId: z.string().min(1).max(50),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/),
  authState: z.enum(['pending_code', 'pending_2fa', 'completed', 'expired', 'failed']),
});
export const selectTelegramAuthSessionSchema = createSelectSchema(telegramAuthSessions);
export type InsertTelegramAuthSession = z.infer<typeof insertTelegramAuthSessionSchema>;
export type SelectTelegramAuthSession = z.infer<typeof selectTelegramAuthSessionSchema>;
export type TelegramAuthSessionRecord = typeof telegramAuthSessions.$inferSelect;

// Auth state enum for type safety
export type TelegramAuthState = 'pending_code' | 'pending_2fa' | 'completed' | 'expired' | 'failed';

// ============================================
// USER PHOTO QUOTA TABLE (Freemium + Payments)
// ============================================

/**
 * Таблица квот на фото для пользователей
 * Хранит счётчик бесплатных фото и информацию об оплатах
 */
export const userPhotoQuota = pgTable('user_photo_quota', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Telegram user ID
  telegramId: varchar('telegram_id', { length: 50 }).notNull().unique(),

  // Freemium лимит
  freePhotosUsed: integer('free_photos_used').notNull().default(0),
  freePhotosLimit: integer('free_photos_limit').notNull().default(5),

  // Оплаченные фото
  paidPhotos: integer('paid_photos').notNull().default(0),
  totalSpentStars: integer('total_spent_stars').notNull().default(0),

  // Даты
  lastPaymentAt: timestamp('last_payment_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  telegramIdIdx: index('idx_user_photo_quota_telegram_id').on(table.telegramId),
}));

// User Photo Quota schemas and types
export const insertUserPhotoQuotaSchema = createInsertSchema(userPhotoQuota, {
  telegramId: z.string().min(1).max(50),
  freePhotosUsed: z.number().int().min(0).optional(),
  freePhotosLimit: z.number().int().min(0).optional(),
  paidPhotos: z.number().int().min(0).optional(),
  totalSpentStars: z.number().int().min(0).optional(),
});
export const selectUserPhotoQuotaSchema = createSelectSchema(userPhotoQuota);
export type InsertUserPhotoQuota = z.infer<typeof insertUserPhotoQuotaSchema>;
export type SelectUserPhotoQuota = z.infer<typeof selectUserPhotoQuotaSchema>;
export type UserPhotoQuotaRecord = typeof userPhotoQuota.$inferSelect;
