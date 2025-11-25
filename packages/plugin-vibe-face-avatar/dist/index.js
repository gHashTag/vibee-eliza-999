var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};

// src/actions/generateImage.ts
import {
  logger
} from "@elizaos/core";

// src/utils/functional/result.ts
class Left {
  value;
  _tag = "Left";
  constructor(value) {
    this.value = value;
  }
  isLeft() {
    return true;
  }
  isRight() {
    return false;
  }
  map(_f) {
    return this;
  }
  chain(_f) {
    return this;
  }
  match(onLeft, _onRight) {
    return onLeft(this.value);
  }
}

class Right {
  value;
  _tag = "Right";
  constructor(value) {
    this.value = value;
  }
  isLeft() {
    return false;
  }
  isRight() {
    return true;
  }
  map(f) {
    return new Right(f(this.value));
  }
  chain(f) {
    return f(this.value);
  }
  match(_onLeft, onRight) {
    return onRight(this.value);
  }
}
var left = (l) => new Left(l);
var right = (r) => new Right(r);
var tryCatchAsync = (f, onRejected) => async () => {
  try {
    const v = await f();
    return right(v);
  } catch (e) {
    return left(onRejected(e));
  }
};
var runTaskEither = async (te) => {
  return te();
};

// src/types/schemas.ts
import { z } from "zod";
var GenerateImageInputSchema = z.object({
  prompt: z.string().min(3, "Промпт должен быть минимум 3 символа"),
  modelId: z.string().uuid().optional(),
  modelUrl: z.string().url().optional(),
  aspectRatio: z.enum(["1:1", "9:16", "16:9", "4:3"]).default("9:16"),
  numImages: z.number().int().min(1).max(4).default(1),
  negativePrompt: z.string().optional(),
  steps: z.number().int().min(1).max(50).optional(),
  guidanceScale: z.number().min(1).max(20).optional(),
  seed: z.number().int().optional()
});
var GenerateImageOutputSchema = z.object({
  success: z.boolean(),
  imageUrls: z.array(z.string().url()),
  metadata: z.object({
    prompt: z.string(),
    model: z.string(),
    generationTime: z.number(),
    loraUsed: z.boolean().optional(),
    triggerWord: z.string().optional()
  }),
  error: z.string().optional()
});
var NeuroPhotoActionContextSchema = z.object({
  telegramId: z.number().int().positive(),
  botName: z.string(),
  prompt: z.string().min(3),
  modelId: z.string().uuid().optional(),
  modelUrl: z.string().url().optional(),
  userId: z.string().uuid()
});

// src/services/provider-registry.ts
class ImageProviderRegistry {
  providers = new Map;
  register(provider) {
    this.providers.set(provider.name, provider);
    console.log(`✅ Зарегистрирован провайдер: ${provider.name}`);
  }
  get(name) {
    return this.providers.get(name);
  }
  getAll() {
    return Array.from(this.providers.values());
  }
  async getHealthyProviders() {
    const healthy = [];
    for (const provider of this.providers.values()) {
      const health = await provider.healthCheck()();
      if (health.isRight() && health.value.status === "healthy") {
        healthy.push(provider);
      }
    }
    return healthy;
  }
  async getBestProvider() {
    const healthy = await this.getHealthyProviders();
    return healthy[0];
  }
}
var imageProviderRegistry = new ImageProviderRegistry;

// src/db/client.ts
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { drizzle as drizzleSqlite } from "drizzle-orm/bun-sqlite";
import postgres from "postgres";
import { Database } from "bun:sqlite";

// src/db/schema.ts
var exports_schema = {};
__export(exports_schema, {
  userModels: () => userModels,
  selectUserModelSchema: () => selectUserModelSchema,
  insertUserModelSchema: () => insertUserModelSchema
});
import { pgTable, uuid, bigint, varchar, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z as z2 } from "zod";
var userModels = pgTable("user_models", {
  id: uuid("id").primaryKey().defaultRandom(),
  telegram_id: bigint("telegram_id", { mode: "number" }),
  entity_id: varchar("entity_id", { length: 50 }),
  bot_name: varchar("bot_name", { length: 100 }).notNull().default("neuro_face_bot"),
  model_name: varchar("model_name", { length: 100 }).notNull(),
  model_url: text("model_url").notNull(),
  trigger_word: varchar("trigger_word", { length: 50 }).notNull(),
  gender: varchar("gender", { length: 10 }),
  training_model: varchar("training_model", { length: 100 }),
  status: varchar("status", { length: 20 }).notNull().default("training"),
  is_active: boolean("is_active").notNull().default(true),
  metadata: text("metadata"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow()
}, (table) => ({
  telegramIdIdx: index("idx_user_models_telegram_id").on(table.telegram_id),
  entityIdIdx: index("idx_user_models_entity_id").on(table.entity_id),
  botNameIdx: index("idx_user_models_bot_name").on(table.bot_name),
  statusIdx: index("idx_user_models_status").on(table.status),
  isActiveIdx: index("idx_user_models_is_active").on(table.is_active),
  compositeIdx: index("idx_user_models_telegram_bot").on(table.telegram_id, table.bot_name)
}));
var insertUserModelSchema = createInsertSchema(userModels, {
  telegram_id: z2.number().int().positive(),
  entity_id: z2.string().uuid().optional(),
  bot_name: z2.string().min(1).max(100),
  model_name: z2.string().min(1).max(100),
  model_url: z2.string().url(),
  trigger_word: z2.string().min(1).max(50),
  gender: z2.enum(["male", "female", "person"]).optional(),
  status: z2.enum(["training", "completed", "failed"]),
  is_active: z2.boolean().default(true),
  metadata: z2.string().optional()
});
var selectUserModelSchema = createSelectSchema(userModels);

// src/db/schema.sqlite.ts
var exports_schema_sqlite = {};
__export(exports_schema_sqlite, {
  userModels: () => userModels2,
  selectUserModelSchema: () => selectUserModelSchema2,
  insertUserModelSchema: () => insertUserModelSchema2
});
import { sqliteTable, text as text2, integer, index as index2 } from "drizzle-orm/sqlite-core";
import { createInsertSchema as createInsertSchema2, createSelectSchema as createSelectSchema2 } from "drizzle-zod";
import { z as z3 } from "zod";
import { sql } from "drizzle-orm";
var userModels2 = sqliteTable("user_models", {
  id: text2("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  telegram_id: integer("telegram_id"),
  entity_id: text2("entity_id"),
  bot_name: text2("bot_name").notNull().default("neuro_face_bot"),
  model_name: text2("model_name").notNull(),
  model_url: text2("model_url").notNull(),
  trigger_word: text2("trigger_word").notNull(),
  gender: text2("gender"),
  training_model: text2("training_model"),
  status: text2("status").notNull().default("training"),
  is_active: integer("is_active", { mode: "boolean" }).notNull().default(true),
  metadata: text2("metadata"),
  created_at: text2("created_at").default(sql`(datetime('now'))`),
  updated_at: text2("updated_at").default(sql`(datetime('now'))`)
}, (table) => ({
  telegramIdIdx: index2("idx_user_models_telegram_id").on(table.telegram_id),
  entityIdIdx: index2("idx_user_models_entity_id").on(table.entity_id),
  botNameIdx: index2("idx_user_models_bot_name").on(table.bot_name),
  statusIdx: index2("idx_user_models_status").on(table.status),
  isActiveIdx: index2("idx_user_models_is_active").on(table.is_active),
  telegramBotIdx: index2("idx_user_models_telegram_bot").on(table.telegram_id, table.bot_name),
  entityBotIdx: index2("idx_user_models_entity_bot").on(table.entity_id, table.bot_name)
}));
var insertUserModelSchema2 = createInsertSchema2(userModels2, {
  telegram_id: z3.number().int().optional(),
  entity_id: z3.string().uuid().optional(),
  bot_name: z3.string().min(1).max(100),
  model_name: z3.string().min(1).max(100),
  model_url: z3.string().url(),
  trigger_word: z3.string().min(1).max(50),
  gender: z3.enum(["male", "female", "person"]).optional(),
  status: z3.enum(["training", "completed", "failed"]),
  is_active: z3.boolean().default(true),
  metadata: z3.record(z3.unknown()).default({})
}).refine((data) => data.telegram_id || data.entity_id, { message: "Either telegram_id or entity_id must be provided" });
var selectUserModelSchema2 = createSelectSchema2(userModels2);

// src/db/client.ts
import * as fs from "fs";
import * as path from "path";
var DATABASE_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL;
var USE_SQLITE = !DATABASE_URL || DATABASE_URL === "sqlite" || DATABASE_URL.startsWith("sqlite:");
var schema = USE_SQLITE ? exports_schema_sqlite : exports_schema;
var _dbPg = null;
var _dbSqlite = null;
function getDatabaseUrl() {
  if (!DATABASE_URL || DATABASE_URL === "sqlite") {
    throw new Error("DATABASE_URL not configured for PostgreSQL mode");
  }
  return DATABASE_URL;
}
function getSqlitePath() {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, "avatar-face.db");
}
function initSqlite() {
  if (!_dbSqlite) {
    const dbPath = getSqlitePath();
    console.log(`[Avatar Face Plugin] Connecting to SQLite: ${dbPath}`);
    const sqlite = new Database(dbPath);
    _dbSqlite = drizzleSqlite(sqlite, { schema });
    console.log("[Avatar Face Plugin] SQLite connected");
  }
  return _dbSqlite;
}
function initPostgres() {
  if (!_dbPg) {
    const url = getDatabaseUrl();
    console.log("[Avatar Face Plugin] Connecting to PostgreSQL...");
    const queryClient = postgres(url, {
      ssl: url.includes("localhost") ? false : { rejectUnauthorized: false },
      max: 10,
      idle_timeout: 30,
      connect_timeout: 10
    });
    _dbPg = drizzlePg(queryClient, { schema });
    console.log("[Avatar Face Plugin] PostgreSQL connected");
  }
  return _dbPg;
}
var db = new Proxy({}, {
  get(target, prop) {
    try {
      if (USE_SQLITE) {
        return initSqlite()[prop];
      } else {
        return initPostgres()[prop];
      }
    } catch (error) {
      console.error("[Avatar Face Plugin] Database connection failed:", error);
      console.warn("[Avatar Face Plugin] Falling back to SQLite...");
      return initSqlite()[prop];
    }
  }
});
var userModels3 = USE_SQLITE ? userModels2 : userModels;
var DB_MODE = USE_SQLITE ? "SQLite" : "PostgreSQL";
console.log(`[Avatar Face Plugin] Database mode: ${DB_MODE}`);

// src/services/modelLoader.ts
import { eq, and } from "drizzle-orm";
var getUserModelsTask = (userIdentifier, botName = "neuro_face_bot") => tryCatchAsync(async () => {
  try {
    let models;
    if (typeof userIdentifier === "number") {
      console.log(`[ModelLoader] Searching by telegram_id: ${userIdentifier}`);
      models = await db.select().from(userModels3).where(and(eq(userModels3.telegram_id, userIdentifier), eq(userModels3.bot_name, botName), eq(userModels3.is_active, true), eq(userModels3.status, "completed"))).orderBy(userModels3.created_at);
    } else {
      const identifier = userIdentifier;
      console.log(`[ModelLoader] Searching for identifier: ${identifier}`);
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier)) {
        console.log(`[ModelLoader] Strategy 1: Trying as entity_id (UUID): ${identifier}`);
        models = await db.select().from(userModels3).where(and(eq(userModels3.entity_id, identifier), eq(userModels3.bot_name, botName), eq(userModels3.is_active, true), eq(userModels3.status, "completed"))).orderBy(userModels3.created_at);
      }
      if (!models || models.length === 0) {
        console.log(`[ModelLoader] Strategy 2: Trying as model ID (UUID): ${identifier}`);
        models = await db.select().from(userModels3).where(and(eq(userModels3.id, identifier), eq(userModels3.bot_name, botName), eq(userModels3.is_active, true), eq(userModels3.status, "completed"))).orderBy(userModels3.created_at);
      }
      if (!models || models.length === 0 && /^\d+$/.test(identifier)) {
        const telegramId = parseInt(identifier, 10);
        console.log(`[ModelLoader] Strategy 3: Trying as telegram_id: ${telegramId}`);
        models = await db.select().from(userModels3).where(and(eq(userModels3.telegram_id, telegramId), eq(userModels3.bot_name, botName), eq(userModels3.is_active, true), eq(userModels3.status, "completed"))).orderBy(userModels3.created_at);
      }
    }
    console.log(`[ModelLoader] Found ${models?.length || 0} active models for identifier: ${userIdentifier}`);
    const parsedModels = (models || []).map((model) => ({
      ...model,
      metadata: model.metadata ? typeof model.metadata === "string" ? (() => {
        try {
          return JSON.parse(model.metadata);
        } catch {
          return {};
        }
      })() : model.metadata : {}
    }));
    return parsedModels;
  } catch (dbError) {
    console.error("[ModelLoader] Database query failed:", dbError);
    console.warn("[ModelLoader] Returning empty models array (DB unavailable)");
    return [];
  }
}, (error) => {
  const errorMessage = `Failed to load user models: ${error instanceof Error ? error.message : String(error)}`;
  console.error(`[ModelLoader] ${errorMessage}`);
  return new Error(errorMessage);
});

// src/services/generateNeuroPhotoHybrid.ts
async function generateNeuroPhotoHybrid(prompt, modelUrl, numImages, userId, _context, botName = "neuro_face_bot") {
  let effectiveModelUrl = modelUrl;
  let effectiveTriggerWord;
  if (!modelUrl) {
    try {
      let userIdentifier = userId;
      const parsed = parseInt(userId, 10);
      if (!isNaN(parsed)) {
        userIdentifier = parsed;
      }
      const modelsResult = await runTaskEither(getUserModelsTask(userIdentifier, botName));
      if (modelsResult.isRight() && modelsResult.value.length > 0) {
        const userModel = modelsResult.value[0];
        effectiveModelUrl = userModel.model_url;
        effectiveTriggerWord = userModel.trigger_word;
        console.log(`[NeuroPhoto Hybrid] Using user's personal LoRA: ${userModel.model_name} (trigger: ${effectiveTriggerWord})`);
        if (effectiveTriggerWord && !prompt.includes(effectiveTriggerWord)) {
          prompt = `${effectiveTriggerWord}, ${prompt}`;
          console.log(`[NeuroPhoto Hybrid] Injected trigger word: "${effectiveTriggerWord}"`);
        }
      } else {
        console.log("[NeuroPhoto Hybrid] No personal LoRA models found, using default Flux");
      }
    } catch (error) {
      console.warn("[NeuroPhoto Hybrid] Failed to load user models (likely no DB connection):", error);
    }
  }
  let provider = await imageProviderRegistry.getBestProvider();
  if (effectiveModelUrl && effectiveModelUrl.includes("fal-ai")) {
    const falProvider = imageProviderRegistry.get("fal");
    if (falProvider) {
      provider = falProvider;
      console.log("[NeuroPhoto Hybrid] Using Fal.ai provider for LoRA model");
    }
  } else if (effectiveModelUrl && !effectiveModelUrl.includes("fal-ai")) {
    const replicateProvider = imageProviderRegistry.get("replicate");
    if (replicateProvider) {
      provider = replicateProvider;
      console.log("[NeuroPhoto Hybrid] Using Replicate provider");
    }
  }
  if (!provider) {
    return {
      success: false,
      imageUrls: [],
      metadata: {
        prompt,
        model: effectiveModelUrl || "unknown",
        generationTime: 0
      },
      error: "No suitable image generation provider found"
    };
  }
  const options = {
    prompt,
    modelUrl: effectiveModelUrl,
    numImages,
    aspectRatio: "9:16"
  };
  const resultTask = provider.generateImage(options);
  const result = await resultTask();
  if (result.isLeft()) {
    return {
      success: false,
      imageUrls: [],
      metadata: {
        prompt,
        model: effectiveModelUrl || "unknown",
        generationTime: 0
      },
      error: result.value.message
    };
  }
  return result.value;
}

// src/utils/getTelegramId.ts
function getTelegramId(message) {
  if (message?.metadata?.targetUserId && typeof message.metadata.targetUserId === "string") {
    const targetUserId = message.metadata.targetUserId;
    if (/^\d+$/.test(targetUserId)) {
      return parseInt(targetUserId, 10);
    }
  }
  if (message?.metadata?.senderId && typeof message.metadata.senderId === "string") {
    const senderId = message.metadata.senderId;
    if (/^\d+$/.test(senderId)) {
      return parseInt(senderId, 10);
    }
  }
  if (message?.entityId && typeof message.entityId === "string") {
    if (/^\d+$/.test(message.entityId)) {
      return parseInt(message.entityId, 10);
    }
  }
  if (message?.userId) {
    return uuidToTelegramId(message.userId);
  }
  return null;
}
function uuidToTelegramId(userId) {
  let hash = 0;
  for (let i = 0;i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// src/actions/generateImage.ts
var COST_STARS = 7.5;
var generateImageAction = {
  name: "GENERATE_NEUROPHOTO",
  similes: [
    "MAKE_IMAGE",
    "CREATE_PHOTO",
    "NEUROPHOTO",
    "GENERATE_IMAGE",
    "AI_IMAGE",
    "DRAW_IMAGE"
  ],
  description: `Генерирует AI-изображения с помощью Flux/SDXL моделей.
Используй когда пользователь:
- Просит нарисовать/создать/сгенерировать изображение
- Хочет увидеть как что-то выглядит
- Спрашивает "покажи...", "сделай фото...", "нарисуй..."
- Использует команду /neurophoto
Не требует строгого формата команды - понимает естественный язык.`,
  validate: async (_runtime, message) => {
    const text3 = message.content?.text?.toLowerCase();
    if (!text3)
      return false;
    const commands = ["/neurophoto", "нейрофото", "neurophoto"];
    if (commands.some((cmd) => text3.includes(cmd))) {
      return true;
    }
    const intents = [
      "нарисуй",
      "создай изображение",
      "сгенерируй",
      "сделай картинк",
      "хочу фото",
      "покажи как выглядит",
      "сделай фото",
      "generate image",
      "create image",
      "draw",
      "make a picture",
      "show me how",
      "can you draw",
      "make an image"
    ];
    return intents.some((intent) => text3.includes(intent));
  },
  handler: async (runtime, message, _state, _options, callback) => {
    console.log("\uD83D\uDD25\uD83D\uDD25\uD83D\uDD25 generateImageAction HANDLER CALLED! \uD83D\uDD25\uD83D\uDD25\uD83D\uDD25");
    console.log("Message:", JSON.stringify(message, null, 2));
    try {
      const text3 = message.content?.text || "";
      let userId = message.userId;
      if (!userId && message.metadata?.raw?.senderId) {
        userId = message.metadata.raw.senderId;
      }
      if (!userId) {
        await callback?.({
          text: "❌ Не удалось определить пользователя."
        });
        return {
          success: false,
          error: new Error("User ID not found")
        };
      }
      logger.info({ userId, text: text3 }, "Processing image generation request");
      const prompt = extractPrompt(text3);
      if (!prompt || prompt.length < 3) {
        await callback?.({
          text: `❌ Пожалуйста, опишите какое изображение вы хотите создать.

**Просто напишите что хотите создать:**

**Примеры**:
• "нарисуй красивый закат над океаном"
• "создай футуристический город с летающими машинами"
• "сгенерируй портрет кота в космическом шлеме"
• "нарисуй супермена"

**Минимальная длина описания: 3 символа.**`
        });
        return {
          success: false,
          error: new Error("Prompt too short")
        };
      }
      const telegramId = getTelegramId(message);
      const userIdentifier = userId || (telegramId ? String(telegramId) : null);
      if (!userIdentifier) {
        await callback?.({
          text: "❌ Не удалось определить пользователя."
        });
        return {
          success: false,
          error: new Error("User ID not found")
        };
      }
      logger.info({ userId, telegramId, userIdentifier }, "Using user ID for model lookup");
      const modelsTask = getUserModelsTask(userIdentifier, "neuro_face_bot");
      const modelsResult = await modelsTask();
      if (modelsResult.isLeft() || modelsResult.value.length === 0) {
        await callback?.({
          text: `❌ **Сначала создайте свою модель!**

Чтобы я мог генерировать изображения с вашим лицом, нужно:

1️⃣ Загрузите 10-25 своих фотографий (в хорошем качестве)
2️⃣ Скажите "обучить модель" и укажите имя модели
3️⃣ Подождите 10-15 минут пока модель обучится

**Как начать:**
Просто скажите "обучить модель мое_имя" и приложите фото.

Тогда я смогу создавать изображения с вами! \uD83C\uDFA8`
        });
        return {
          success: false,
          error: new Error("No trained models found")
        };
      }
      const userModel = modelsResult.value[0];
      logger.info({ userId, modelName: userModel.model_name }, "Using user's trained model");
      await callback?.({
        text: `\uD83C\uDFA8 Генерирую изображение с вашей моделью **${userModel.model_name}**...
⏱ Это займёт 10-30 секунд...`
      });
      let fullPrompt = prompt;
      if (userModel.trigger_word) {
        fullPrompt = `${userModel.trigger_word}, ${fullPrompt}`;
      }
      logger.info({
        prompt: fullPrompt,
        modelUrl: userModel.model_url,
        triggerWord: userModel.trigger_word
      }, "Generating with user's LoRA");
      try {
        const generationResult = await generateNeuroPhotoHybrid(fullPrompt, userModel.model_url, 1, userId, { gender: userModel.gender }, "web-chat");
        if (!generationResult.success) {
          throw new Error(generationResult.error || "Generation failed");
        }
        const resultText = `✨ **Изображение создано!**

━━━━━━━━━━━━━━━━━━━━
\uD83D\uDCDD **Промпт**
${fullPrompt}

\uD83C\uDFA8 **Детали генерации**
├ \uD83E\uDD16 Модель: **${userModel.model_name}** (ваша LoRA)
├ \uD83C\uDFAF Trigger: **${userModel.trigger_word}**
├ ⏱ Время: **${Math.round(generationResult.metadata.generationTime / 1000)}с**
└ \uD83D\uDCB0 Стоимость: **${COST_STARS}⭐**

_Создано с вашей персональной моделью • @999-agents_`;
        if (callback) {
          await callback({
            text: resultText,
            attachments: generationResult.imageUrls.map((url, index3) => ({
              id: `neurophoto-${Date.now()}-${index3}`,
              url,
              type: "image",
              title: fullPrompt,
              description: `Generated by ${userModel.model_name}`
            }))
          });
        }
        return {
          success: true,
          text: "Изображение успешно сгенерировано",
          data: generationResult
        };
      } catch (error) {
        logger.error({ error }, "Generation failed");
        throw error;
      }
    } catch (error) {
      logger.error({ error }, "Unexpected error in generateImageAction");
      await callback?.({
        text: "❌ Произошла непредвиденная ошибка при генерации изображения."
      });
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "/neurophoto красивый закат над океаном" }
      },
      {
        user: "{{agentName}}",
        content: {
          text: "✅ Изображение готово!",
          action: "GENERATE_NEUROPHOTO"
        }
      }
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "нарисуй футуристический город" }
      },
      {
        user: "{{agentName}}",
        content: {
          text: "\uD83C\uDFA8 Генерирую изображение...",
          action: "GENERATE_NEUROPHOTO"
        }
      }
    ]
  ]
};
function extractPrompt(text3) {
  const cleaned = text3.replace(/\/neurophoto/gi, "").replace(/\/generate/gi, "").replace(/нейрофото/gi, "").replace(/создай изображение/gi, "").replace(/сгенерируй картинку/gi, "").replace(/нарисуй/gi, "").replace(/generate image/gi, "").replace(/create image/gi, "").replace(/draw/gi, "").trim();
  if (cleaned.length < 3 && text3.length > cleaned.length) {
    const words = text3.split(/\s+/);
    const commandWords = ["нарисуй", "создай", "сгенерируй", "draw", "generate"];
    for (let i = 0;i < words.length; i++) {
      const word = words[i].toLowerCase().replace(/[^\w]/g, "");
      if (commandWords.includes(word) && i + 1 < words.length) {
        return words.slice(i + 1).join(" ").trim();
      }
    }
    return text3;
  }
  return cleaned;
}

// src/actions/faceTrainAction.ts
import { eq as eq2 } from "drizzle-orm";
import { randomUUID } from "crypto";
var faceTrainAction = {
  name: "FACE_TRAIN",
  description: "Обучает персональную LoRA модель из фотографий пользователя",
  validate: async (runtime, message) => {
    const text3 = message.content.text.toLowerCase();
    if (text3.includes("/face train") || text3.includes("/face add")) {
      return true;
    }
    const trainingIntents = [
      "обучить модель",
      "создать модель",
      "сделать модель",
      "создай модель",
      "создай лора",
      "обучить лора",
      "train model",
      "create model",
      "make model",
      "i want to train",
      "want to train",
      "create my model",
      "make my model"
    ];
    return trainingIntents.some((intent) => text3.includes(intent));
  },
  handler: async (runtime, message, state, options, callback) => {
    const telegramId = message.entityId || message.id;
    const text3 = message.content.text;
    try {
      const modelName = extractModelName(text3);
      if (!modelName) {
        await callback({
          text: `❌ Пожалуйста, укажите имя модели.

**Как создать модель:**
Просто скажите "обучить модель МОЯ_МОДЕЛЬ" и приложите фото.

Пример: "обучить модель Alex"`,
          error: true
        });
        return {
          success: false,
          text: "Model name is required",
          data: { actionName: "FACE_TRAIN", error: "Model name missing" }
        };
      }
      const sanitizedName = modelName.replace(/[^a-zA-Z0-9_\s-]/g, "").trim();
      if (sanitizedName.length < 2 || sanitizedName.length > 50) {
        await callback({
          text: `❌ **Имя модели должно содержать от 2 до 50 символов**

Вы указали: "${modelName}"
Длина: ${sanitizedName.length} символов

Попробуйте короче: "Alex", "John", "MyModel"`,
          error: true
        });
        return {
          success: false,
          text: "Model name length invalid",
          data: { actionName: "FACE_TRAIN", error: "Name length 2-50 required" }
        };
      }
      const triggerWord = `${sanitizedName.toUpperCase().replace(/\s+/g, "_")}_${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
      const existingModels = await db.select().from(userModels3).where(eq2(userModels3.telegram_id, parseInt(telegramId, 10)));
      if (existingModels.length >= 10) {
        await callback({
          text: "❌ У вас уже максимальное количество моделей (10). Удалите старые модели, чтобы создать новые.",
          error: true
        });
        return {
          success: false,
          text: "Max models limit reached",
          data: { actionName: "FACE_TRAIN", error: "Limit 10 models" }
        };
      }
      const modelId = randomUUID();
      const now = new Date().toISOString();
      await db.insert(userModels3).values({
        id: modelId,
        telegram_id: parseInt(telegramId, 10),
        bot_name: runtime.character?.name || "neuro_face_bot",
        model_name: sanitizedName,
        model_url: "",
        trigger_word: triggerWord,
        gender: "person",
        status: "training",
        is_active: true,
        metadata: JSON.stringify({ created_by: "face_train_action" }),
        created_at: now,
        updated_at: now
      });
      console.log(`[FACE_TRAIN] Created model record: ${modelId} for user ${telegramId}`);
      await callback({
        text: `✅ Модель "${sanitizedName}" создана! (trigger: ${triggerWord})

\uD83D\uDCF8 Теперь загрузите от 10 до 25 фотографий для обучения.

\uD83D\uDCB0 Стоимость обучения: ⭐ 200 звезд

Я начну обучение, как только получу фотографии!`,
        action: "FACE_TRAIN"
      });
      return {
        success: true,
        text: `Model created: ${modelName}`,
        values: {
          model_id: modelId,
          model_name: sanitizedName,
          trigger_word: triggerWord,
          status: "training"
        },
        data: {
          actionName: "FACE_TRAIN",
          modelId,
          modelName: sanitizedName,
          triggerWord
        }
      };
    } catch (error) {
      console.error("[FACE_TRAIN] Error:", error);
      await callback({
        text: "❌ Произошла ошибка при создании модели. Попробуйте позже.",
        error: true
      });
      return {
        success: false,
        text: "Failed to create model",
        error: error instanceof Error ? error : new Error(String(error)),
        data: {
          actionName: "FACE_TRAIN",
          errorMessage: error instanceof Error ? error.message : String(error)
        }
      };
    }
  },
  examples: [
    [
      { name: "user", content: { text: "/face train MyFaceModel" } },
      { name: "assistant", content: { text: 'Модель "MyFaceModel" создана! Загрузите фотографии для обучения.', action: "FACE_TRAIN" } }
    ],
    [
      { name: "user", content: { text: "обучить модель Alex" } },
      { name: "assistant", content: { text: 'Модель "Alex" создана! Загрузите фотографии для обучения.', action: "FACE_TRAIN" } }
    ]
  ]
};
function extractModelName(text3) {
  const lowerText = text3.toLowerCase();
  if (lowerText.includes("/face train") || lowerText.includes("/face add")) {
    const parts = text3.split(" ");
    const modelName = parts.slice(2).join(" ").trim();
    return modelName || null;
  }
  const patterns = [
    /обучить\s+модель\s+([a-zA-Z0-9_\s-]+)/i,
    /создать\s+модель\s+([a-zA-Z0-9_\s-]+)/i,
    /сделать\s+модель\s+([a-zA-Z0-9_\s-]+)/i,
    /создай\s+модель\s+([a-zA-Z0-9_\s-]+)/i,
    /train\s+model\s+([a-zA-Z0-9_\s-]+)/i,
    /create\s+model\s+([a-zA-Z0-9_\s-]+)/i,
    /make\s+model\s+([a-zA-Z0-9_\s-]+)/i
  ];
  for (const pattern of patterns) {
    const match = text3.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

// src/actions/photoUploadAction.ts
import { eq as eq4, and as and3 } from "drizzle-orm";

// src/services/falTrainingService.ts
import { fal } from "@fal-ai/client";
import { eq as eq3 } from "drizzle-orm";
async function startFalTraining(config) {
  const {
    modelId,
    trigger_word,
    photo_urls,
    steps = 500,
    lora_rank = 16
  } = config;
  console.log(`[FalTraining] Starting training for ${modelId}`);
  console.log(`[FalTraining] Photos: ${photo_urls.length}, Steps: ${steps}, Rank: ${lora_rank}`);
  try {
    if (process.env.FAL_KEY) {
      fal.config({
        credentials: process.env.FAL_KEY
      });
    }
    const result = await fal.subscribe("fal-ai/flux-lora-fast-training", {
      input: {
        images_data_url: photo_urls,
        trigger_word,
        steps,
        lora_rank
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log(`[FalTraining] Progress update for ${modelId}`);
          const progress = extractProgress(update.logs || []);
          db.update(userModels3).set({
            metadata: JSON.stringify({
              progress,
              fal_job_id: update.request_id,
              last_log: update.logs?.[update.logs.length - 1]?.message || ""
            })
          }).where(eq3(userModels3.id, modelId)).catch((err) => console.error("[FalTraining] Failed to update progress:", err));
        }
      }
    });
    console.log(`[FalTraining] Training complete for ${modelId}`);
    console.log(`[FalTraining] Result:`, result);
    const modelUrl = result.diffusers_lora_file?.url || result.config_file?.url || "";
    if (!modelUrl) {
      throw new Error("No model URL returned from Fal.ai");
    }
    await db.update(userModels3).set({
      model_url: modelUrl,
      status: "completed",
      updated_at: new Date().toISOString(),
      metadata: JSON.stringify({
        progress: 100,
        fal_job_id: result.request_id,
        completed_at: new Date().toISOString()
      })
    }).where(eq3(userModels3.id, modelId));
    console.log(`[FalTraining] Model saved: ${modelUrl}`);
  } catch (error) {
    console.error(`[FalTraining] Training failed for ${modelId}:`, error);
    await db.update(userModels3).set({
      status: "failed",
      updated_at: new Date().toISOString(),
      metadata: JSON.stringify({
        error: error.message || "Training failed",
        failed_at: new Date().toISOString()
      })
    }).where(eq3(userModels3.id, modelId));
  }
}
function extractProgress(logs) {
  if (!logs || logs.length === 0)
    return 0;
  const lastLog = logs[logs.length - 1]?.message || "";
  const stepMatch = lastLog.match(/Step (\d+)\/(\d+)/i);
  if (stepMatch) {
    const current = parseInt(stepMatch[1]);
    const total = parseInt(stepMatch[2]);
    return Math.round(current / total * 100);
  }
  const percentMatch = lastLog.match(/(\d+)%/);
  if (percentMatch) {
    return parseInt(percentMatch[1]);
  }
  return 50;
}

// src/actions/photoUploadAction.ts
var photoUploadAction = {
  name: "PHOTO_UPLOAD",
  description: "Обрабатывает загруженные фотографии и запускает обучение LoRA модели",
  validate: async (runtime, message) => {
    const hasAttachments = message.content.attachments && message.content.attachments.length > 0;
    const entityId = message.entityId;
    if (!entityId)
      return false;
    const trainingModels = await db.select().from(userModels3).where(and3(eq4(userModels3.entity_id, entityId), eq4(userModels3.status, "training"), eq4(userModels3.is_active, true)));
    const hasTrainingModel = trainingModels.length > 0;
    console.log(`[PHOTO_UPLOAD] Validation: hasAttachments=${hasAttachments}, hasTrainingModel=${hasTrainingModel}`);
    return hasAttachments && hasTrainingModel;
  },
  handler: async (runtime, message, state, options, callback) => {
    const telegramId = message.entityId || message.id;
    const attachments = message.content.attachments || [];
    try {
      console.log(`[PHOTO_UPLOAD] Processing ${attachments.length} attachments for user ${telegramId}`);
      const trainingModels = await db.select().from(userModels3).where(and3(eq4(userModels3.telegram_id, parseInt(telegramId, 10)), eq4(userModels3.status, "training"), eq4(userModels3.is_active, true)));
      if (trainingModels.length === 0) {
        await callback({
          text: "❌ У вас нет модели в процессе обучения. Сначала выполните команду /face train.",
          error: true
        });
        return {
          success: false,
          text: "No training model found",
          data: { actionName: "PHOTO_UPLOAD", error: "No training model" }
        };
      }
      const model = trainingModels[0];
      console.log(`[PHOTO_UPLOAD] Found training model: ${model.model_name} (${model.id})`);
      if (attachments.length < 5) {
        await callback({
          text: `❌ Нужно минимум 5 фотографий для обучения. Вы загрузили только ${attachments.length}.`,
          error: true
        });
        return {
          success: false,
          text: "Too few photos",
          data: { actionName: "PHOTO_UPLOAD", error: "Minimum 5 photos required" }
        };
      }
      if (attachments.length > 25) {
        await callback({
          text: `❌ Максимум 25 фотографий для обучения. Вы загрузили ${attachments.length}.`,
          error: true
        });
        return {
          success: false,
          text: "Too many photos",
          data: { actionName: "PHOTO_UPLOAD", error: "Maximum 25 photos allowed" }
        };
      }
      const photoUrls = attachments.filter((att) => att?.url || att?.filePath || att?.content).map((att) => att.url || att.filePath || att.content);
      console.log(`[PHOTO_UPLOAD] Extracted ${photoUrls.length} photo URLs`);
      await callback({
        text: `✅ Получено ${attachments.length} фотографий для модели "${model.model_name}". Начинаю обучение...`,
        action: "PHOTO_UPLOAD"
      });
      startFalTraining({
        modelId: model.id,
        trigger_word: model.trigger_word,
        photo_urls: photoUrls,
        steps: 500,
        lora_rank: 16
      }).catch((error) => {
        console.error(`[PHOTO_UPLOAD] Background training error for model ${model.id}:`, error);
      });
      return {
        success: true,
        text: "Photo upload completed, training started",
        values: {
          model_id: model.id,
          model_name: model.model_name,
          photo_count: attachments.length,
          status: "training_started"
        },
        data: {
          actionName: "PHOTO_UPLOAD",
          modelId: model.id,
          photoCount: attachments.length
        }
      };
    } catch (error) {
      console.error("[PHOTO_UPLOAD] Error:", error);
      await callback({
        text: "❌ Произошла ошибка при обработке фотографий. Попробуйте позже.",
        error: true
      });
      return {
        success: false,
        text: "Failed to process photos",
        error: error instanceof Error ? error : new Error(String(error)),
        data: {
          actionName: "PHOTO_UPLOAD",
          errorMessage: error instanceof Error ? error.message : String(error)
        }
      };
    }
  },
  examples: [
    [
      {
        name: "user",
        content: {
          text: "Вот мои фотографии",
          attachments: [
            { url: "https://example.com/photo1.jpg" },
            { url: "https://example.com/photo2.jpg" }
          ]
        }
      },
      {
        name: "assistant",
        content: {
          text: "Получено 2 фотографии. Начинаю обучение...",
          action: "PHOTO_UPLOAD"
        }
      }
    ]
  ]
};

// src/actions/listModelsAction.ts
import { eq as eq5, and as and4 } from "drizzle-orm";

// src/utils/userHelpers.ts
function uuidToTelegramId2(userId) {
  let hash = 0;
  for (let i = 0;i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// src/actions/listModelsAction.ts
var listModelsAction = {
  name: "LIST_MODELS",
  description: "Список всех моделей пользователя с их статусом и индикаторами",
  validate: async (runtime, message) => {
    const text3 = message.content.text?.toLowerCase() || "";
    return text3.includes("/list models") || text3.includes("/models") || text3.includes("/my models");
  },
  handler: async (runtime, message, state, options, callback) => {
    try {
      const telegramId = uuidToTelegramId2(message.userId);
      if (!telegramId) {
        await callback({
          text: "❌ Ошибка определения пользователя. Попробуйте еще раз."
        });
        return { success: false, error: new Error("Failed to extract telegram ID") };
      }
      const models = await db.select().from(userModels3).where(and4(eq5(userModels3.telegram_id, telegramId), eq5(userModels3.bot_name, "neuro_face_bot"))).orderBy(userModels3.created_at);
      if (!models || models.length === 0) {
        await callback({
          text: "\uD83D\uDCDD У вас пока нет моделей. Создайте первую командой `/face train`"
        });
        return { success: true, data: { models: [] } };
      }
      const formattedModels = models.map((model) => {
        let statusIcon = "";
        let statusText = "";
        let statusEmoji = "";
        if (model.is_active) {
          if (model.status === "completed") {
            statusEmoji = "✅";
            statusText = "Активна";
          } else if (model.status === "training") {
            statusEmoji = "\uD83D\uDD04";
            statusText = "В обучении";
          } else if (model.status === "failed") {
            statusEmoji = "❌";
            statusText = "Ошибка обучения";
          }
        } else {
          statusEmoji = "⏸️";
          statusText = "Неактивна";
        }
        const createdDate = new Date(model.created_at).toLocaleDateString("ru-RU", {
          year: "numeric",
          month: "short",
          day: "numeric"
        });
        return `${statusEmoji} **${model.model_name}** (trigger: ${model.trigger_word})
   ${statusText} - Создана: ${createdDate}
`;
      });
      const messageText = `\uD83D\uDCCB **Ваши модели:**

${formattedModels.join(`
`)}

\uD83D\uDCA1 Используйте \`/activate model <имя>\` для активации, \`/deactivate model <имя>\` для деактивации.`;
      await callback({
        text: messageText
      });
      return {
        success: true,
        data: {
          models,
          count: models.length,
          activeCount: models.filter((m) => m.is_active && m.status === "completed").length
        }
      };
    } catch (error) {
      console.error("Error in listModelsAction:", error);
      await callback({
        text: "❌ Ошибка при получении списка моделей. Попробуйте позже."
      });
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  },
  examples: [
    [
      {
        name: "user",
        content: { text: "/list models" }
      },
      {
        name: "assistant",
        content: {
          text: `\uD83D\uDCCB **Ваши модели:**

✅ **MyModel** (trigger: NEURO_SAGE)
   Активна - Создана: 15 янв 2024

⏸️ **OldModel** (trigger: NEURO_OLD)
   Неактивна - Создана: 10 янв 2024

\uD83D\uDCA1 Используйте \`/activate model <имя>\` для активации.`
        }
      }
    ]
  ]
};

// src/actions/deleteModelAction.ts
import { eq as eq6, and as and5 } from "drizzle-orm";
var deleteModelAction = {
  name: "DELETE_MODEL",
  description: "Удаляет модель пользователя (мягкое удаление)",
  validate: async (runtime, message) => {
    const text3 = message.content.text?.toLowerCase() || "";
    return text3.includes("/delete model") || text3.includes("/remove model");
  },
  handler: async (runtime, message, state, options, callback) => {
    try {
      const text3 = message.content.text || "";
      const parts = text3.split(" ");
      const modelIdentifier = parts.slice(2).join(" ").trim();
      if (!modelIdentifier) {
        await callback({
          text: "❌ Укажите название модели. Пример: `/delete model MyModel`"
        });
        return { success: false, error: new Error("Model name not provided") };
      }
      const telegramId = uuidToTelegramId2(message.userId);
      if (!telegramId) {
        await callback({
          text: "❌ Ошибка определения пользователя. Попробуйте еще раз."
        });
        return { success: false, error: new Error("Failed to extract telegram ID") };
      }
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(modelIdentifier);
      let model;
      if (isUUID) {
        const result = await db.select().from(userModels3).where(and5(eq6(userModels3.id, modelIdentifier), eq6(userModels3.telegram_id, telegramId)));
        model = result[0];
      }
      if (!model) {
        const result = await db.select().from(userModels3).where(and5(eq6(userModels3.model_name, modelIdentifier), eq6(userModels3.telegram_id, telegramId)));
        model = result[0];
      }
      if (!model) {
        await callback({
          text: "❌ Модель не найдена. Используйте `/list models` чтобы увидеть ваши модели."
        });
        return { success: false, error: new Error("Model not found") };
      }
      const activeModels = await db.select().from(userModels3).where(and5(eq6(userModels3.telegram_id, telegramId), eq6(userModels3.is_active, true), eq6(userModels3.status, "completed")));
      const isLastActive = activeModels.length === 1 && model.is_active && model.status === "completed";
      await db.update(userModels3).set({
        is_active: false,
        updated_at: new Date().toISOString()
      }).where(eq6(userModels3.id, model.id));
      let responseText = `✅ Модель **${model.model_name}** удалена. Вы можете восстановить её, обратившись в поддержку.`;
      if (isLastActive) {
        responseText += `

⚠️ Это была ваша последняя активная модель. После удаления вы не сможете генерировать изображения.`;
      }
      await callback({
        text: responseText
      });
      return {
        success: true,
        data: {
          deletedModel: {
            id: model.id,
            name: model.model_name,
            trigger_word: model.trigger_word
          },
          wasLastActive: isLastActive
        }
      };
    } catch (error) {
      console.error("Error in deleteModelAction:", error);
      await callback({
        text: "❌ Ошибка при удалении модели. Попробуйте позже."
      });
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  },
  examples: [
    [
      {
        name: "user",
        content: { text: "/delete model MyModel" }
      },
      {
        name: "assistant",
        content: {
          text: "✅ Модель **MyModel** удалена. Вы можете восстановить её, обратившись в поддержку."
        }
      }
    ],
    [
      {
        name: "user",
        content: { text: "/remove model OldModel" }
      },
      {
        name: "assistant",
        content: {
          text: "✅ Модель **OldModel** удалена. Вы можете восстановить её, обратившись в поддержку."
        }
      }
    ]
  ]
};

// src/actions/setActiveModelAction.ts
import { eq as eq7, and as and6 } from "drizzle-orm";
var setActiveModelAction = {
  name: "SET_ACTIVE_MODEL",
  description: "Активирует или деактивирует модель пользователя",
  validate: async (runtime, message) => {
    const text3 = message.content.text?.toLowerCase() || "";
    return text3.includes("/activate model") || text3.includes("/deactivate model") || text3.includes("/toggle model");
  },
  handler: async (runtime, message, state, options, callback) => {
    try {
      const text3 = message.content.text || "";
      const parts = text3.split(" ");
      const actionType = parts[0].toLowerCase();
      const modelIdentifier = parts.slice(2).join(" ").trim();
      if (!modelIdentifier) {
        const command = actionType.includes("activate") ? "/activate" : "/deactivate";
        await callback({
          text: `❌ Укажите название модели. Пример: \`${command} model MyModel\``
        });
        return { success: false, error: new Error("Model name not provided") };
      }
      const telegramId = uuidToTelegramId2(message.userId);
      if (!telegramId) {
        await callback({
          text: "❌ Ошибка определения пользователя. Попробуйте еще раз."
        });
        return { success: false, error: new Error("Failed to extract telegram ID") };
      }
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(modelIdentifier);
      let model;
      if (isUUID) {
        const result = await db.select().from(userModels3).where(and6(eq7(userModels3.id, modelIdentifier), eq7(userModels3.telegram_id, telegramId)));
        model = result[0];
      }
      if (!model) {
        const result = await db.select().from(userModels3).where(and6(eq7(userModels3.model_name, modelIdentifier), eq7(userModels3.telegram_id, telegramId)));
        model = result[0];
      }
      if (!model) {
        await callback({
          text: "❌ Модель не найдена. Используйте `/list models` чтобы увидеть ваши модели."
        });
        return { success: false, error: new Error("Model not found") };
      }
      if (actionType.includes("activate") && model.status !== "completed") {
        await callback({
          text: `❌ Модель **${model.model_name}** имеет статус "${model.status}". Активировать можно только завершенные модели.`
        });
        return { success: false, error: new Error("Cannot activate non-completed model") };
      }
      let newActiveState;
      let actionDescription;
      if (actionType.includes("activate")) {
        newActiveState = true;
        actionDescription = "активирована";
      } else if (actionType.includes("deactivate")) {
        newActiveState = false;
        actionDescription = "деактивирована";
      } else {
        newActiveState = !model.is_active;
        actionDescription = newActiveState ? "активирована" : "деактивирована";
      }
      if (newActiveState && model.is_active) {
        await callback({
          text: `ℹ️ Модель **${model.model_name}** уже активирована.`
        });
        return { success: true, data: { alreadyActive: true } };
      }
      if (!newActiveState && !model.is_active) {
        await callback({
          text: `ℹ️ Модель **${model.model_name}** уже деактивирована.`
        });
        return { success: true, data: { alreadyInactive: true } };
      }
      await db.update(userModels3).set({
        is_active: newActiveState,
        updated_at: new Date().toISOString()
      }).where(eq7(userModels3.id, model.id));
      let responseText = `✅ Модель **${model.model_name}** ${actionDescription}.`;
      if (newActiveState) {
        responseText += " Теперь она будет использоваться для генерации изображений.";
        const activeModels = await db.select().from(userModels3).where(and6(eq7(userModels3.telegram_id, telegramId), eq7(userModels3.is_active, true), eq7(userModels3.status, "completed"), eq7(userModels3.id, model.id)));
        const allActiveModels = await db.select().from(userModels3).where(and6(eq7(userModels3.telegram_id, telegramId), eq7(userModels3.is_active, true), eq7(userModels3.status, "completed")));
        if (allActiveModels.length > 1) {
          responseText += `

ℹ️ У вас несколько активных моделей. При генерации будет использоваться самая новая.`;
        }
      } else {
        responseText += " Она не будет использоваться для генерации.";
        const remainingActiveModels = await db.select().from(userModels3).where(and6(eq7(userModels3.telegram_id, telegramId), eq7(userModels3.is_active, true), eq7(userModels3.status, "completed")));
        if (remainingActiveModels.length === 0) {
          responseText += `

⚠️ Это ваша последняя активная модель. После деактивации вы не сможете генерировать изображения.`;
        }
      }
      await callback({
        text: responseText
      });
      return {
        success: true,
        data: {
          model: {
            id: model.id,
            name: model.model_name,
            trigger_word: model.trigger_word
          },
          action: actionDescription,
          newActiveState
        }
      };
    } catch (error) {
      console.error("Error in setActiveModelAction:", error);
      await callback({
        text: "❌ Ошибка при изменении статуса модели. Попробуйте позже."
      });
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  },
  examples: [
    [
      {
        name: "user",
        content: { text: "/activate model MyModel" }
      },
      {
        name: "assistant",
        content: {
          text: "✅ Модель **MyModel** активирована. Теперь она будет использоваться для генерации изображений."
        }
      }
    ],
    [
      {
        name: "user",
        content: { text: "/deactivate model MyModel" }
      },
      {
        name: "assistant",
        content: {
          text: "⏸️ Модель **MyModel** деактивирована. Она не будет использоваться для генерации."
        }
      }
    ],
    [
      {
        name: "user",
        content: { text: "/toggle model MyModel" }
      },
      {
        name: "assistant",
        content: {
          text: "✅ Модель **MyModel** деактивирована. Она не будет использоваться для генерации."
        }
      }
    ]
  ]
};

// src/providers/neuroPhotoProvider.ts
var neuroPhotoProvider = {
  name: "neuroPhotoProvider",
  get: async (runtime, _message, _state) => {
    const defaultModel = runtime.getSetting("DEFAULT_MODEL") || "black-forest-labs/flux-schnell";
    return {
      text: `
# \uD83C\uDFA8 NeuroPhoto - AI Image Generation

## Available Commands
- \`/neurophoto <описание>\` - Генерация AI-изображения
- \`нарисуй <описание>\` - Альтернативная команда (русский)
- \`create image <описание>\` - Альтернативная команда (английский)

## Current Configuration
- **Default Model**: ${defaultModel}
- **Generation Time**: 10-30 seconds
- **Image Format**: 9:16 (vertical, для Instagram Stories)
- **Cost**: 7.5⭐ per image

## Examples
✅ **Good prompts**:
- "/neurophoto beautiful sunset over the ocean"
- "нарисуй футуристический город с летающими машинами"
- "create image of a cat in a spacesuit"

❌ **Bad prompts**:
- "/neurophoto cat" (too short, not descriptive)
- "нарисуй" (no description)

## Tips for Better Results
1. Be specific and descriptive
2. Include details about style, colors, mood
3. Mention lighting and composition
4. Use English for best results with most models

## Available Models
- **Flux Schnell**: Fast, high-quality images (default)
- **Flux Pro**: Premium quality, slower
- **SDXL**: General-purpose, reliable
      `.trim(),
      values: {
        defaultModel,
        supportedCommands: [
          "/neurophoto",
          "нарисуй",
          "создай изображение",
          "create image"
        ],
        cost: 7.5,
        currency: "stars"
      }
    };
  }
};

// src/services/replicateService.ts
import Replicate from "replicate";
import { Service } from "@elizaos/core";
class ReplicateService extends Service {
  static serviceType = "replicate";
  client = null;
  runtime = null;
  constructor(runtime) {
    super(runtime);
    this.runtime = runtime;
  }
  async start() {
    if (!this.runtime)
      return;
    try {
      const apiKey = this.runtime.getSetting("REPLICATE_API_KEY");
      if (!apiKey) {
        console.warn("⚠️  REPLICATE_API_KEY не найден. ReplicateService будет неактивен.");
        return;
      }
      this.client = new Replicate({
        auth: apiKey
      });
      console.log("✅ ReplicateService инициализирован с Replicate API");
    } catch (error) {
      console.warn("⚠️  REPLICATE_API_KEY не удалось расшифровать. ReplicateService будет неактивен.");
      console.warn(`⚠️  Ошибка: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }
  }
  async initialize(runtime) {
    this.runtime = runtime;
  }
  async stop() {
    this.client = null;
    console.log("\uD83D\uDED1 ReplicateService stopped");
  }
  get capabilityDescription() {
    return "Replicate integration for image generation with LoRA models";
  }
  static async start(runtime) {
    const service = new ReplicateService(runtime);
    await service.start();
    return service;
  }
  static async stop(runtime) {
    return;
  }
  generateImage(options) {
    return this.generateImageWithLora(options.prompt, {
      triggerWord: options.triggerWord,
      gender: options.gender
    }, options);
  }
  generateImageWithLora(prompt, loraConfig, options) {
    if (!this.client) {
      return left(new Error("Replicate Service не инициализирован. Проверьте REPLICATE_API_KEY в настройках."));
    }
    const enhancedPrompt = this.buildEnhancedPrompt(prompt, loraConfig);
    console.log(`[Replicate] Генерация изображения с LoRA`);
    console.log(`[Replicate] Оригинальный промпт: ${prompt}`);
    console.log(`[Replicate] Улучшенный промпт: ${enhancedPrompt}`);
    console.log(`[Replicate] LoRA URL: ${loraConfig.modelUrl || "не указан"}`);
    try {
      const model = "flux-dev-lora";
      const version = "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b";
      const input = {
        prompt: enhancedPrompt,
        image_size: "landscape_4_3",
        num_outputs: options.numImages || 1,
        num_inference_steps: options.numInferenceSteps || 50,
        guidance_scale: 7.5
      };
      if (loraConfig.modelUrl) {
        input.lora_scale = 0.85;
        input.lora_url = loraConfig.modelUrl;
      }
      return left(new Error("Используйте Replicate client напрямую или ReplicateServiceImpl для асинхронной генерации"));
    } catch (error) {
      console.error("[Replicate] Ошибка генерации:", error);
      return left(error instanceof Error ? error : new Error(String(error)));
    }
  }
  async generateImageAsync(prompt, loraConfig, options) {
    if (!this.client) {
      return Promise.resolve(left(new Error("Replicate Service не инициализирован")));
    }
    try {
      const enhancedPrompt = this.buildEnhancedPrompt(prompt, loraConfig);
      const model = loraConfig.modelUrl ? "flux-dev-lora" : "flux-schnell";
      const version = loraConfig.modelUrl ? "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b" : "ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4";
      const input = {
        prompt: enhancedPrompt,
        image_size: "landscape_4_3",
        num_outputs: options.numImages || 1,
        num_inference_steps: options.numInferenceSteps || 50,
        guidance_scale: 7.5
      };
      if (loraConfig.modelUrl) {
        input.lora_scale = 0.85;
        input.lora_url = loraConfig.modelUrl;
      }
      console.log(`[Replicate] Отправляем запрос к ${model}`);
      const output = await this.client.run(`${model}:${version}`, { input });
      console.log(`[Replicate] Получен результат:`, output);
      const imageUrls = this.extractImageUrls(output);
      const success = imageUrls.length > 0;
      if (success) {
        console.log(`[Replicate] ✅ Сгенерировано ${imageUrls.length} изображений`);
        return Promise.resolve(right({
          success: true,
          imageUrls,
          metadata: {
            enhanced_prompt: enhancedPrompt,
            provider: "replicate",
            model,
            version,
            lora_url: loraConfig.modelUrl || null,
            lora_scale: loraConfig.modelUrl ? 0.85 : null
          }
        }));
      } else {
        console.error("[Replicate] ❌ Изображения не найдены в ответе");
        return Promise.resolve(left(new Error("Изображения не найдены в ответе Replicate")));
      }
    } catch (error) {
      console.error("[Replicate] ❌ Ошибка:", error);
      return Promise.resolve(left(error instanceof Error ? error : new Error(String(error))));
    }
  }
}

// src/services/falService.ts
import { fal as fal2 } from "@fal-ai/client";
import { Service as Service2 } from "@elizaos/core";
class FalService extends Service2 {
  static serviceType = "fal";
  apiKey = null;
  runtime = null;
  constructor(runtime) {
    super(runtime);
    this.runtime = runtime;
  }
  async start() {
    if (!this.runtime)
      return;
    try {
      const apiKey = this.runtime.getSetting("FAL_KEY");
      if (!apiKey) {
        console.warn("⚠️  FAL_KEY не найден. FalService будет неактивен.");
        return;
      }
      fal2.config({
        credentials: apiKey
      });
      this.apiKey = apiKey;
      console.log("✅ FalService инициализирован с Fal.ai");
    } catch (error) {
      console.warn("⚠️  FAL_KEY не удалось расшифровать. FalService будет неактивен.");
      console.warn(`⚠️  Ошибка: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }
  }
  async initialize(runtime) {
    this.runtime = runtime;
  }
  async stop() {
    this.apiKey = null;
    console.log("\uD83D\uDED1 FalService stopped");
  }
  get capabilityDescription() {
    return "Fal.ai integration for LoRA training and image generation";
  }
  static async start(runtime) {
    const service = new FalService(runtime);
    await service.start();
    return service;
  }
  static async stop(runtime) {
    return;
  }
  generateImage(options) {
    return this.generateImageWithLora(options.prompt, {
      triggerWord: options.triggerWord,
      gender: options.gender
    }, options);
  }
  generateImageWithLora(prompt, loraConfig, options) {
    if (!this.apiKey) {
      return left(new Error("Fal Service не инициализирован. Проверьте FAL_KEY в настройках."));
    }
    const enhancedPrompt = this.buildEnhancedPrompt(prompt, loraConfig);
    console.log(`[Fal.ai] Генерация изображения с LoRA`);
    console.log(`[Fal.ai] Оригинальный промпт: ${prompt}`);
    console.log(`[Fal.ai] Улучшенный промпт: ${enhancedPrompt}`);
    console.log(`[Fal.ai] LoRA URL: ${loraConfig.modelUrl || "не указан"}`);
    try {
      const modelId = loraConfig.modelUrl ? "fal-ai/flux-dev-lora" : "fal-ai/flux-schnell";
      const input = {
        prompt: enhancedPrompt,
        image_size: "landscape_4_3",
        num_inference_steps: options.numInferenceSteps || 28,
        guidance_scale: 3.5,
        num_images: options.numImages || 1
      };
      if (loraConfig.modelUrl) {
        input.lora_scale = 0.85;
        input.lora_url = loraConfig.modelUrl;
      }
      return left(new Error("Synchronous generation not supported. Use async/await pattern."));
    } catch (error) {
      console.error("[Fal.ai] Ошибка генерации:", error);
      return left(error instanceof Error ? error : new Error(String(error)));
    }
  }
  async generateImageAsync(prompt, loraConfig, options) {
    if (!this.apiKey) {
      return Promise.resolve(left(new Error("Fal Service не инициализирован")));
    }
    try {
      const enhancedPrompt = this.buildEnhancedPrompt(prompt, loraConfig);
      const modelId = loraConfig.modelUrl ? "fal-ai/flux-dev-lora" : "fal-ai/flux-schnell";
      const input = {
        prompt: enhancedPrompt,
        image_size: "landscape_4_3",
        num_inference_steps: options.numInferenceSteps || 28,
        guidance_scale: 3.5,
        num_images: options.numImages || 1
      };
      if (loraConfig.modelUrl) {
        input.lora_scale = 0.85;
        input.lora_url = loraConfig.modelUrl;
      }
      console.log(`[Fal.ai] Отправляем запрос к ${modelId}`);
      const result = await fal2.subscribe(modelId, {
        input,
        logs: true
      });
      console.log(`[Fal.ai] Получен результат:`, result);
      const imageUrls = this.extractImageUrls(result);
      const success = imageUrls.length > 0;
      if (success) {
        console.log(`[Fal.ai] ✅ Сгенерировано ${imageUrls.length} изображений`);
        return Promise.resolve(right({
          success: true,
          imageUrls,
          metadata: {
            enhanced_prompt: enhancedPrompt,
            provider: "fal-ai",
            model: modelId,
            lora_url: loraConfig.modelUrl || null,
            lora_scale: loraConfig.modelUrl ? 0.85 : null
          }
        }));
      } else {
        console.error("[Fal.ai] ❌ Изображения не найдены в ответе");
        return Promise.resolve(left(new Error("Изображения не найдены в ответе Fal.ai")));
      }
    } catch (error) {
      console.error("[Fal.ai] ❌ Ошибка:", error);
      return Promise.resolve(left(error instanceof Error ? error : new Error(String(error))));
    }
  }
}

// src/config/image-models.config.ts
var IMAGE_MODELS = {
  flux_schnell: {
    id: "flux_schnell",
    name: "Flux Schnell",
    provider: "replicate",
    apiModel: "black-forest-labs/flux-schnell",
    description: "Fast, high-quality image generation",
    pricing: { fixedPriceStars: 4 },
    apiSettings: {
      aspectRatios: ["1:1", "16:9", "9:16", "4:3"],
      maxImages: 4,
      supportsNegativePrompt: true,
      supportsSeed: true,
      supportsSteps: true,
      supportsGuidanceScale: true
    },
    status: "active"
  },
  fal_flux_lora: {
    id: "fal_flux_lora",
    name: "Fal.ai Flux LoRA",
    provider: "fal",
    apiModel: "fal-ai/flux-lora",
    description: "Flux with LoRA support for personalized images",
    pricing: { fixedPriceStars: 4 },
    apiSettings: {
      aspectRatios: ["9:16"],
      maxImages: 4,
      supportsNegativePrompt: true,
      supportsSeed: true,
      supportsSteps: true,
      supportsGuidanceScale: true,
      supportsLoRA: true
    },
    status: "active"
  }
};
function getImageModel(id) {
  return IMAGE_MODELS[id];
}
function getImageModelsByProvider(provider) {
  return Object.values(IMAGE_MODELS).filter((model) => model.provider === provider && model.status === "active");
}

// src/providers/replicateProvider.ts
import Replicate2 from "replicate";

class ReplicateProvider {
  name = "replicate";
  description = "AI image generation using Replicate API with Flux, SDXL, SD3, Recraft, Photon and other models";
  client = null;
  apiKey = null;
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.client = new Replicate2({ auth: apiKey });
  }
  get supportedModels() {
    return getImageModelsByProvider("replicate").map((model) => model.id);
  }
  healthCheck() {
    return tryCatchAsync(async () => {
      if (!this.client) {
        throw new Error("Replicate client не инициализирован");
      }
      return { status: "healthy" };
    }, (error) => error instanceof Error ? error : new Error(String(error)));
  }
  generateImage(options) {
    if (!this.client) {
      return left(new Error("Replicate Provider не инициализирован"));
    }
    return tryCatchAsync(async () => {
      const startTime = Date.now();
      const modelConfig = options.modelId ? getImageModel(options.modelId) : getImageModel("flux_schnell");
      if (!modelConfig) {
        throw new Error(`Модель не найдена: ${options.modelId || "flux_schnell"}`);
      }
      const modelUrl = modelConfig.apiModel;
      const numImages = Math.min(options.numImages || 1, modelConfig.apiSettings.maxImages);
      const input = {
        prompt: options.prompt,
        num_outputs: numImages
      };
      if (options.aspectRatio && modelConfig.apiSettings.aspectRatios.includes(options.aspectRatio)) {
        input.aspect_ratio = options.aspectRatio;
      }
      if (options.negativePrompt && modelConfig.apiSettings.supportsNegativePrompt) {
        input.negative_prompt = options.negativePrompt;
      }
      if (options.steps && modelConfig.apiSettings.supportsSteps) {
        input.num_inference_steps = options.steps;
      }
      if (options.guidanceScale && modelConfig.apiSettings.supportsGuidanceScale) {
        input.guidance_scale = options.guidanceScale;
      }
      if (options.seed && modelConfig.apiSettings.supportsSeed) {
        input.seed = options.seed;
      }
      if (modelConfig.apiSettings.baseInput) {
        Object.assign(input, modelConfig.apiSettings.baseInput);
      }
      const output = await this.client.run(modelUrl, { input });
      const generationTime = Date.now() - startTime;
      let imageUrls;
      if (Array.isArray(output)) {
        imageUrls = output.filter((url) => typeof url === "string");
      } else if (typeof output === "string") {
        imageUrls = [output];
      } else if (output && typeof output === "object" && "output" in output) {
        const outputData = output.output;
        imageUrls = Array.isArray(outputData) ? outputData : [outputData];
      } else {
        throw new Error("Неожиданный формат ответа от Replicate");
      }
      return {
        success: true,
        imageUrls,
        metadata: {
          prompt: options.prompt,
          model: modelUrl,
          generationTime
        }
      };
    }, (error) => error instanceof Error ? error : new Error(String(error)));
  }
  getModelInfo(modelId) {
    return tryCatchAsync(async () => {
      const modelConfig = getImageModel(modelId);
      if (!modelConfig) {
        throw new Error(`Модель не найдена: ${modelId}`);
      }
      return {
        id: modelConfig.id,
        name: modelConfig.name,
        provider: modelConfig.provider,
        description: modelConfig.description,
        pricePerImage: modelConfig.pricing.fixedPriceStars || 0,
        estimatedTime: 10,
        supportedFeatures: [
          ...modelConfig.apiSettings.supportsNegativePrompt ? ["negative-prompt"] : [],
          ...modelConfig.apiSettings.supportsSeed ? ["seed"] : [],
          ...modelConfig.apiSettings.supportsSteps ? ["steps"] : [],
          ...modelConfig.apiSettings.supportsGuidanceScale ? ["guidance-scale"] : [],
          ...modelConfig.apiSettings.supportsLoRA ? ["lora"] : []
        ],
        aspectRatios: modelConfig.apiSettings.aspectRatios,
        maxImages: modelConfig.apiSettings.maxImages
      };
    }, (error) => error instanceof Error ? error : new Error(String(error)));
  }
  listModels() {
    return tryCatchAsync(async () => {
      const models = getImageModelsByProvider("replicate");
      return Promise.all(models.map((model) => this.getModelInfo(model.id)())).then((results) => results.filter((result) => result.isRight()).map((result) => result.value));
    }, (error) => error instanceof Error ? error : new Error(String(error)));
  }
}

// src/providers/falProvider.ts
import { fal as fal3 } from "@fal-ai/client";

class FalProvider {
  name = "fal";
  description = "AI image generation using Fal.ai API with LoRA support for personalized images";
  apiKey = null;
  defaultLoRA;
  constructor(apiKey, defaultLoRA) {
    this.apiKey = apiKey;
    this.defaultLoRA = defaultLoRA;
    fal3.config({
      credentials: apiKey
    });
  }
  get supportedModels() {
    return getImageModelsByProvider("fal").map((model) => model.id);
  }
  healthCheck() {
    return tryCatchAsync(async () => {
      if (!this.apiKey) {
        throw new Error("Fal.ai API key не установлен");
      }
      return { status: "healthy" };
    }, (error) => error instanceof Error ? error : new Error(String(error)));
  }
  generateImage(options) {
    if (!this.apiKey) {
      return left(new Error("Fal Provider не инициализирован"));
    }
    return tryCatchAsync(async () => {
      const startTime = Date.now();
      const modelConfig = options.modelId ? getImageModel(options.modelId) : getImageModel("fal_flux_lora");
      if (!modelConfig) {
        throw new Error(`Модель не найдена: ${options.modelId || "fal_flux_lora"}`);
      }
      const modelUrl = modelConfig.apiModel;
      let enhancedPrompt = options.prompt;
      if (this.defaultLoRA && modelConfig.apiSettings.supportsLoRA) {
        enhancedPrompt = `${this.defaultLoRA.triggerWord} ${options.prompt}`;
      }
      const input = {
        prompt: enhancedPrompt,
        image_size: {
          width: 768,
          height: 1365
        },
        num_images: Math.min(options.numImages || 1, modelConfig.apiSettings.maxImages)
      };
      const isLoRATrainedModel = options.modelUrl && options.modelUrl.includes("fal.run/fal-ai/flux-lora");
      if (modelConfig.apiSettings.supportsLoRA && !isLoRATrainedModel) {
        input.loras = [];
        if (this.defaultLoRA) {
          input.loras.push({
            path: this.defaultLoRA.path,
            scale: this.defaultLoRA.scale
          });
        }
      }
      if (options.negativePrompt && modelConfig.apiSettings.supportsNegativePrompt) {
        input.negative_prompt = options.negativePrompt;
      }
      if (options.steps && modelConfig.apiSettings.supportsSteps) {
        input.num_inference_steps = options.steps;
      }
      if (options.guidanceScale && modelConfig.apiSettings.supportsGuidanceScale) {
        input.guidance_scale = options.guidanceScale;
      }
      if (options.seed && modelConfig.apiSettings.supportsSeed) {
        input.seed = options.seed;
      }
      const result = await fal3.subscribe(modelUrl, {
        input,
        logs: false
      });
      const generationTime = Date.now() - startTime;
      const output = result;
      let imageUrls = [];
      if (output.images && Array.isArray(output.images)) {
        imageUrls = output.images.map((img) => img.url);
      } else if (output.image_url) {
        imageUrls = [output.image_url];
      } else if (output.url) {
        imageUrls = [output.url];
      } else {
        throw new Error("Неожиданный формат ответа от Fal.ai");
      }
      return {
        success: true,
        imageUrls,
        metadata: {
          prompt: enhancedPrompt,
          model: modelUrl,
          generationTime,
          loraUsed: this.defaultLoRA?.path,
          triggerWord: this.defaultLoRA?.triggerWord
        }
      };
    }, (error) => error instanceof Error ? error : new Error(String(error)));
  }
  getModelInfo(modelId) {
    return tryCatchAsync(async () => {
      const modelConfig = getImageModel(modelId);
      if (!modelConfig) {
        throw new Error(`Модель не найдена: ${modelId}`);
      }
      return {
        id: modelConfig.id,
        name: modelConfig.name,
        provider: modelConfig.provider,
        description: modelConfig.description,
        pricePerImage: modelConfig.pricing.fixedPriceStars || 0,
        estimatedTime: 15,
        supportedFeatures: [
          ...modelConfig.apiSettings.supportsNegativePrompt ? ["negative-prompt"] : [],
          ...modelConfig.apiSettings.supportsSeed ? ["seed"] : [],
          ...modelConfig.apiSettings.supportsSteps ? ["steps"] : [],
          ...modelConfig.apiSettings.supportsGuidanceScale ? ["guidance-scale"] : [],
          ...modelConfig.apiSettings.supportsLoRA ? ["lora"] : []
        ],
        aspectRatios: modelConfig.apiSettings.aspectRatios,
        maxImages: modelConfig.apiSettings.maxImages
      };
    }, (error) => error instanceof Error ? error : new Error(String(error)));
  }
  listModels() {
    return tryCatchAsync(async () => {
      const models = getImageModelsByProvider("fal");
      return Promise.all(models.map((model) => this.getModelInfo(model.id)())).then((results) => results.filter((result) => result.isRight()).map((result) => result.value));
    }, (error) => error instanceof Error ? error : new Error(String(error)));
  }
}

// src/services/providers.ts
function initializeProviders(runtime) {
  const replicateApiKey = runtime.getSetting("REPLICATE_API_KEY");
  if (replicateApiKey) {
    const replicateProvider = new ReplicateProvider(replicateApiKey);
    imageProviderRegistry.register(replicateProvider);
  }
  const falApiKey = runtime.getSetting("FAL_KEY");
  if (falApiKey) {
    const defaultLoRA = {
      path: runtime.getSetting("FAL_DEFAULT_LORA_PATH") || "",
      scale: Number(runtime.getSetting("FAL_DEFAULT_LORA_SCALE")) || 1,
      triggerWord: runtime.getSetting("FAL_LORA_TRIGGER") || "NEURO_SAGE"
    };
    const falProvider = new FalProvider(falApiKey, defaultLoRA);
    imageProviderRegistry.register(falProvider);
  }
  console.log(`✅ Зарегистрировано провайдеров: ${imageProviderRegistry.getAll().length}`);
}
// src/index.ts
var vibeFaceAvatarPlugin = {
  name: "neurophoto",
  description: "AI image generation with Replicate/Fal.ai models",
  actions: [generateImageAction, faceTrainAction, photoUploadAction, listModelsAction, deleteModelAction, setActiveModelAction],
  services: [ReplicateService, FalService],
  providers: [neuroPhotoProvider],
  evaluators: [],
  init: async (_config, runtime) => {
    console.log("✅ NeuroPhoto plugin initializing...");
    initializeProviders(runtime);
    console.log("✅ NeuroPhoto plugin initialized");
  }
};
var src_default = vibeFaceAvatarPlugin;
export {
  vibeFaceAvatarPlugin,
  setActiveModelAction,
  photoUploadAction,
  neuroPhotoProvider,
  listModelsAction,
  generateImageAction,
  faceTrainAction,
  deleteModelAction,
  src_default as default,
  ReplicateService,
  NeuroPhotoActionContextSchema,
  GenerateImageOutputSchema,
  GenerateImageInputSchema,
  FalService
};

//# debugId=5F3A0E4A004A6F9164756E2164756E21
//# sourceMappingURL=index.js.map
