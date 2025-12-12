// @ts-nocheck
/**
 * ProactiveAvatarService
 *
 * Сервис для проактивной рекламы через креативные аватарки
 *
 * Функционал:
 * - Раз в день берёт аватарку случайного участника группы
 * - Создаёт креативное фото через Nano Banana Pro
 * - Отправляет в группу с тегом пользователя
 * - Продвигает услуги бота @neuro_blogger_bot
 *
 * СТРАТЕГИЯ: ТОЛЬКО ДЕВОЧКИ!
 * - Фильтрует пользователей по полу (только female)
 * - Использует только женские промпты (FEMALE_PROMPTS)
 * - Пропускает мужчин на этапе выбора пользователя
 * - Использует референсное изображение стиля (assets/snow-girl.jpg) для применения стиля к генерациям
 *
 * Референсное изображение:
 * - Загружается при инициализации сервиса из assets/snow-girl.jpg
 * - Используется как единственное изображение в массиве image_input для Nano Banana Pro
 * - Референс snow-girl.jpg применяет стиль, цветовую палитру, освещение и композицию
 * - Поза и ракурс генерируются по промпту (разные каждый раз)
 */

import { Service, IAgentRuntime, logger, ModelType } from "@elizaos/core";
import { TelegramService } from "./telegram.service";
import { NanoBananaService } from "./nanoBanana.service";
import { PaymentService, PRICES, FREE_PHOTOS_LIMIT } from "./payment.service";
import { ITelegramUser } from "../types/telegram.types";
import { AGENTS_CONFIG, getAgentConfig } from "../config/agents.config";
import {
  AvatarAnalysisService,
  AvatarAnalysis,
} from "./avatarAnalysis.service";
import { detectGenderByName } from "../utils/genderDetection";
import * as fs from "fs";
import * as path from "path";

/**
 * Логгер для ProactiveAvatarService
 */
const log = {
  info: (msg: string) => logger.info(`[ProactiveAvatar] ${msg}`),
  warn: (msg: string) => logger.warn(`[ProactiveAvatar] ${msg}`),
  error: (msg: string, err?: unknown) =>
    logger.error(`[ProactiveAvatar] ${msg}: ${err}`),
  debug: (msg: string) => logger.debug(`[ProactiveAvatar] ${msg}`),
};

/**
 * Промпты для женских портретов в формате MIDJOURNEY
 * Ключевые элементы: authentic skin texture, natural pores, catchlights
 * Формат: [Subject] + [Details] + [Style] + [Lighting] + [Mood] + [Parameters]
 * Источники: Midjourney v7 best practices, Reddit, myaiforce.com, bananabatch.com
 */
const FEMALE_PROMPTS = [
  // Разные позы и ракурсы - стоя с разными положениями рук
  "Full body shot of a woman standing confidently, one hand on hip, other hand touching hair, looking over shoulder, three-quarter view, dynamic pose, authentic skin texture, soft natural lighting, shot on Canon 85mm f/1.4, editorial photography, 8K quality --ar 9:16 --s 300 --v 7",

  "Woman standing sideways, arms crossed, looking back at camera, elegant silhouette, dramatic side lighting, full body composition, shot on Sony A7R IV 50mm, fashion photography style, shallow depth of field --ar 9:16 --s 400 --v 7",

  "Woman walking away from camera, one arm extended backward, turning head back, candid moment, natural movement, soft golden hour lighting, environmental portrait, shot on Canon 85mm f/1.4, lifestyle photography --ar 9:16 --s 350 --v 7",

  "Woman standing, both hands behind head, looking at camera, confident pose, three-quarter view, studio lighting, shot on Canon 85mm f/1.2, professional portrait, 8K quality --ar 9:16 --s 250 --v 7",

  "Woman standing, one hand in pocket, other hand pointing forward, looking away, casual pose, natural daylight, shot on Nikon 85mm f/1.4, lifestyle photography --ar 9:16 --s 300 --v 7",

  // Сидящие позы с разными положениями рук
  "Woman sitting on edge of chair, one hand on knee, other hand resting on chair arm, leaning forward, engaging eye contact, three-quarter angle, confident pose, studio lighting, shot on Canon 85mm f/1.2, professional portrait, 8K quality --ar 9:16 --s 250 --v 7",

  "Woman sitting cross-legged on floor, both hands clasped together, looking up at camera from low angle, relaxed casual pose, natural window light, lifestyle photography, shot on Sigma 85mm f/1.4, warm tones --ar 9:16 --s 300 --v 7",

  "Woman sitting on windowsill, one hand touching face, other hand resting on windowsill, looking outside, profile view, contemplative mood, soft diffused light, cinematic composition, shot on Hasselblad, medium format aesthetic --ar 9:16 --s 500 --v 7",

  "Woman sitting, both hands holding cup, leaning forward, three-quarter view, cozy atmosphere, natural window light, shot on Canon 85mm f/1.4, lifestyle photography --ar 9:16 --s 350 --v 7",

  // Динамичные позы с разными положениями рук
  "Woman in motion, mid-stride, one arm swinging forward, other arm back, hair flowing, dynamic movement, action photography, motion blur background, sharp focus on subject, shot on Canon 5D Mark IV 85mm, energetic lighting --ar 9:16 --s 400 --v 7",

  "Woman dancing, both arms raised high above head, joyful expression, spinning motion, vibrant colors, party atmosphere, shot on Sony A7R IV, wide angle 35mm, shallow depth of field --ar 9:16 --s 450 --v 7",

  "Woman reaching up, both arms extended upward, stretching pose, looking upward, full body, athletic movement, natural daylight, shot on Nikon 85mm f/1.4, photorealistic, 8K quality --ar 9:16 --s 300 --v 7",

  "Woman standing, one arm extended to side, other hand on hip, dynamic pose, three-quarter view, shot on Canon 85mm f/1.4, editorial style --ar 9:16 --s 400 --v 7",

  // Разные ракурсы с разными положениями рук
  "Woman from high angle, one hand touching hair, other hand resting on shoulder, looking up at camera, sitting pose, intimate perspective, soft top lighting, shot on Canon 85mm f/1.4, portrait photography, authentic skin texture --ar 9:16 --s 250 --v 7",

  "Woman from low angle, arms crossed, looking down, powerful perspective, standing pose, dramatic lighting from below, cinematic style, shot on Sony A7R IV 24mm, wide angle distortion --ar 9:16 --s 500 --v 7",

  "Woman in profile, one hand on hip, other hand touching face, side view, elegant silhouette, dramatic rim lighting, minimalist composition, shot on Canon 85mm f/1.2, fine art photography --ar 9:16 --s 400 --v 7",

  // Лежащие/расслабленные позы с разными положениями рук
  "Woman lying on side, one hand propped on elbow, other hand resting on hip, looking at camera, relaxed intimate pose, soft natural lighting, lifestyle photography, shot on Canon 85mm f/1.4, warm color palette --ar 9:16 --s 300 --v 7",

  "Woman reclining on couch, one hand behind head, other hand resting on stomach, one leg up, casual relaxed pose, three-quarter view, ambient room lighting, shot on Sigma 85mm f/1.4, editorial style --ar 9:16 --s 350 --v 7",

  // Гламурный стиль с разными позами и положениями рук
  "Glamorous woman standing in vintage red convertible, one hand on door, other hand on hip, confident pose, looking at camera, snowy forest background, high-fashion aesthetic, shot on Canon 85mm f/1.4, 8K quality, photorealistic --ar 9:16 --s 500 --v 7",

  "Glamorous woman sitting on car hood, one hand touching hair, other hand resting on leg, legs crossed, looking away, elegant pose, luxury setting, dramatic lighting, professional photography, shot on Canon 85mm f/1.4, shallow depth of field --ar 9:16 --s 500 --v 7",

  "Glamorous woman standing, both hands open wide, welcoming pose, looking at camera, three-quarter view, luxury setting, shot on Canon 85mm f/1.4, editorial photography --ar 9:16 --s 450 --v 7",
];

/**
 * Промпты для мужских портретов (оптимизированы для реалистичности)
 * Ключевые элементы: authentic skin texture, stubble detail, catchlights
 * Источники: Reddit, myaiforce.com, bananabatch.com
 */
const MALE_PROMPTS = [
  // Профессиональные с реалистичной кожей
  "Professional portrait photograph of a man, authentic skin texture with natural pores and visible stubble, expressive eyes with catchlights, dramatic Rembrandt lighting, shallow depth of field, shot on Canon 85mm f/1.4, DSLR quality, true-to-life colors",

  "Corporate headshot of a confident man, real skin texture with natural imperfections, genuine expression, soft studio lighting, neutral background, shot on Sony A7R IV 85mm, photorealistic quality",

  "Editorial portrait of a man, detailed skin texture with pores and fine lines, natural stubble visible, expressive eyes, soft window light, shot on Sigma 85mm f/1.4, magazine quality",

  // Современные с текстурой
  "Modern lifestyle portrait of a man, authentic skin with visible pores, natural hair texture, relaxed genuine expression, golden hour lighting, shallow depth of field, shot on Nikon 85mm f/1.4, photorealistic",

  "Contemporary portrait of a stylish man, real skin texture, subtle stubble detail, confident natural expression, soft studio lighting, shot on Canon 5D Mark IV, editorial photography style",

  "Urban portrait of a young man, authentic skin details with natural imperfections, genuine emotion, natural daylight, shallow depth of field, shot on Sony 85mm f/1.4, documentary style",

  // Художественные но реалистичные
  "Fine art portrait of a man, detailed skin texture with visible pores, expressive eyes with catchlights, dramatic chiaroscuro lighting, rich shadows, shot on Hasselblad, cinematic quality",

  "Atmospheric portrait of a man, authentic skin with stubble and natural texture, intense but genuine gaze, moody Rembrandt lighting, shot on Canon 85mm f/1.2, editorial color grading, photorealistic",
];

/**
 * Negative prompt для предотвращения AI-артефактов
 * Убирает "пластиковую кожу", uncanny valley, и другие типичные проблемы
 */
const DEFAULT_NEGATIVE_PROMPT =
  "plastic skin, smooth skin, airbrushed, uncanny valley, doll-like, wax figure, " +
  "3d render, cartoon, anime, sketches, painting, illustration, digital art, " +
  "deformed, blurry, bad anatomy, disfigured, poorly drawn face, mutation, " +
  "mutated, extra limbs, extra fingers, malformed hands, missing fingers, " +
  "watermark, signature, text, logo, oversaturated, overexposed, " +
  "low quality, jpeg artifacts, cropped, out of frame";

// Gender detection moved to ../utils/genderDetection.ts (using sex-by-russian-name library)

// Legacy fallback (для совместимости)
const CREATIVE_PROMPTS = [...FEMALE_PROMPTS, ...MALE_PROMPTS];

/**
 * Fallback сообщения (если LLM недоступен)
 * Взрослый, профессиональный стиль без подросткового сленга
 */
const FALLBACK_PROMO_MESSAGES = [
  `@{username}, посмотрите, что получилось.\nЕсли хотите ещё — напишите в личные сообщения.`,
  `@{username}, вот ваш креативный портрет.\nДля новых вариантов пишите в ЛС.`,
  `@{username}, готово.\nЗа дополнительными работами — в личку.`,
  `@{username}, ваш AI-портрет.\nХотите попробовать другой стиль? Напишите мне.`,
  `@{username}, принимайте результат.\nБольше вариантов — в личных сообщениях.`,
  `@{username}, вот что вышло.\nЕсли интересно продолжить — пишите.`,
  `@{username}, ваш персональный арт готов.\nДля обсуждения — в личку.`,
  `@{username}, смотрите результат.\nЗа новыми идеями — в личные сообщения.`,
];

/**
 * Рекламные тексты для бота (добавляются в конец каждого поста)
 */
const BOT_PROMO_MESSAGES = [
  `Больше нейросетей и функций в боте @neuro_blogger_bot`,
  `Попробуйте больше AI-инструментов: @neuro_blogger_bot`,
  `Ещё больше возможностей в @neuro_blogger_bot`,
  `Генерация фото, текстов и не только — @neuro_blogger_bot`,
  `AI-помощник для блогеров: @neuro_blogger_bot`,
  `Нейросети для контента — @neuro_blogger_bot`,
  `Создавайте контент с AI: @neuro_blogger_bot`,
  `Все AI-инструменты в одном боте: @neuro_blogger_bot`,
  `Автоматизируйте контент с @neuro_blogger_bot`,
  `Бот для креаторов: @neuro_blogger_bot`,
];

/**
 * Получить случайную рекламу бота
 */
function getRandomBotPromo(): string {
  const randomIndex = Math.floor(Math.random() * BOT_PROMO_MESSAGES.length);
  return BOT_PROMO_MESSAGES[randomIndex];
}

/**
 * Получить fallback сообщение
 */
function getFallbackPromoMessage(username: string): string {
  const randomIndex = Math.floor(
    Math.random() * FALLBACK_PROMO_MESSAGES.length
  );
  return FALLBACK_PROMO_MESSAGES[randomIndex].replace("{username}", username);
}

/**
 * Интервалы (в минутах)
 */
const DEFAULT_INTERVAL_MINUTES = 1; // 1 минута для тестирования стиля
const MIN_INTERVAL_MINUTES = 1; // Минимум 1 минута между сообщениями

/**
 * Путь к референсному изображению стиля
 * Используется для применения стиля к проактивным генерациям (только для девочек)
 * Используем snow-girl.jpg как референс для целевых групп
 */
const STYLE_REFERENCE_IMAGE_PATH = path.join(
  process.cwd(),
  "assets",
  "snow-girl.jpg"
);

/**
 * Состояние проактивного сервиса
 */
interface ProactiveState {
  /** ID последних обработанных пользователей (чтобы не повторяться) */
  processedUsers: Set<string>;
  /** Время последней отправки */
  lastSentTime: Date | null;
  /** Активен ли таймер */
  isActive: boolean;
  /** ID таймера */
  timerId: NodeJS.Timeout | null;
}

/**
 * ProactiveAvatarService - проактивная реклама через аватарки
 */
export class ProactiveAvatarService extends Service {
  static serviceType = "proactive-avatar";
  serviceType = "proactive-avatar";

  /**
   * Static start method required by ElizaOS 1.6+
   */
  static async start(runtime: IAgentRuntime): Promise<Service> {
    log.info("STATIC start() called");
    const instance = new ProactiveAvatarService();
    await instance.initialize(runtime);
    await instance.start();
    return instance;
  }

  /**
   * Static stop method required by ElizaOS 1.6+
   */
  static async stop(runtime: IAgentRuntime): Promise<void> {
    log.info("STATIC stop() called");
    const instance = runtime.getService(
      "proactive-avatar"
    ) as ProactiveAvatarService;
    if (instance) {
      await instance.stop();
    }
  }

  capabilityDescription =
    "Проактивная реклама через креативные аватарки участников группы";

  /** Runtime агента */
  private runtime: IAgentRuntime | null = null;

  /** Состояние по чатам */
  private stateByChat: Map<string, ProactiveState> = new Map();

  /** Флаг инициализации */
  private isInitialized = false;

  /** Сервис анализа аватарок (YOLO + LLaVA) */
  private avatarAnalysis: AvatarAnalysisService | null = null;

  /** Кэш референсного изображения стиля (data URL) */
  private styleReferenceImage: string | null = null;

  /**
   * Инициализация сервиса
   */
  async initialize(runtime: IAgentRuntime): Promise<void> {
    if (this.isInitialized) {
      log.warn("Service already initialized");
      return;
    }

    this.runtime = runtime;
    this.isInitialized = true;

    // Инициализируем AvatarAnalysisService если есть ключ Replicate
    const replicateKey =
      runtime.getSetting("REPLICATE_API_KEY") || process.env.REPLICATE_API_KEY;
    if (replicateKey) {
      this.avatarAnalysis = new AvatarAnalysisService(replicateKey);
      log.info("AvatarAnalysisService initialized (YOLO + LLaVA)");
    } else {
      log.warn("REPLICATE_API_KEY not found, avatar analysis disabled");
    }

    // Загружаем референсное изображение стиля
    await this.loadStyleReferenceImage();

    log.info("Service initialized");
  }

  /**
   * Загрузить референсное изображение стиля из локального файла
   * Конвертирует в data URL для использования с Nano Banana Pro
   */
  private async loadStyleReferenceImage(): Promise<void> {
    try {
      log.info(
        `🔍 Attempting to load style reference image from: ${STYLE_REFERENCE_IMAGE_PATH}`
      );
      log.info(`🔍 Current working directory: ${process.cwd()}`);

      if (!fs.existsSync(STYLE_REFERENCE_IMAGE_PATH)) {
        log.warn(
          `⚠️ Style reference image not found at ${STYLE_REFERENCE_IMAGE_PATH}, continuing without style reference`
        );
        log.warn(
          `⚠️ Please ensure assets/snow-girl.jpg exists in the project root`
        );
        return;
      }

      // Читаем файл
      const imageBuffer = fs.readFileSync(STYLE_REFERENCE_IMAGE_PATH);
      log.info(
        `📸 Read image file: ${(imageBuffer.length / 1024).toFixed(2)} KB`
      );

      // Конвертируем в base64
      const base64Image = imageBuffer.toString("base64");

      // Создаём data URL (определяем MIME type по расширению)
      const mimeType = "image/jpeg"; // snow-girl.jpg
      this.styleReferenceImage = `data:${mimeType};base64,${base64Image}`;

      log.info(
        `✅ Style reference image loaded successfully from ${STYLE_REFERENCE_IMAGE_PATH} (${(imageBuffer.length / 1024).toFixed(2)} KB, base64: ${base64Image.length} chars, data URL: ${this.styleReferenceImage.length} chars)`
      );
    } catch (error) {
      log.error("❌ Failed to load style reference image", error);
      log.error(
        `Error details: ${error instanceof Error ? error.message : String(error)}`
      );
      this.styleReferenceImage = null;
    }
  }

  /**
   * Получить референсное изображение стиля (data URL)
   * @returns data URL изображения или null если не загружено
   */
  private getStyleReferenceImage(): string | null {
    return this.styleReferenceImage;
  }

  /**
   * Запуск сервиса - запускаем проактивные таймеры для всех целевых чатов
   */
  async start(): Promise<void> {
    if (!this.runtime) {
      log.error("❌ Runtime not set - proactive service cannot start");
      return;
    }

    // Получаем конфигурацию Sales агента
    const salesConfig = getAgentConfig("sales");
    if (!salesConfig) {
      log.error(
        "❌ Sales agent config not found - proactive service cannot start"
      );
      log.error("❌ Make sure 'sales' agent is configured in agents.config.ts");
      return;
    }

    // Проверяем, включен ли проактивный режим
    if (!salesConfig.behavior.proactiveEnabled) {
      log.warn(
        "⚠️ Proactive mode disabled for sales agent. Enable it in agents.config.ts"
      );
      log.warn(
        "⚠️ Set behavior.proactiveEnabled = true to enable proactive mode"
      );
      return;
    }

    const intervalMinutes =
      salesConfig.behavior.proactiveIntervalMinutes || DEFAULT_INTERVAL_MINUTES;

    log.info(
      `📋 Sales agent config: proactiveEnabled=${salesConfig.behavior.proactiveEnabled}, interval=${intervalMinutes} min`
    );
    log.info(`📋 Target chats count: ${salesConfig.targetChats.length}`);

    // Проверяем наличие целевых чатов
    if (salesConfig.targetChats.length === 0) {
      log.warn("⚠️ No target chats configured for sales agent!");
      log.warn(
        "⚠️ Add targetChats in agents.config.ts to enable proactive mode"
      );
      return;
    }

    // Запускаем таймеры для всех целевых чатов Sales агента
    let activeChatsCount = 0;
    for (const chat of salesConfig.targetChats) {
      log.info(
        `📋 Checking chat: ${chat.chatName} (${chat.chatId}), isActive=${chat.isActive}`
      );
      if (chat.isActive) {
        this.startProactiveLoop(chat.chatId, intervalMinutes);
        activeChatsCount++;
        log.info(
          `✅ Started proactive loop for chat ${chat.chatName} (${chat.chatId}), interval: ${intervalMinutes} min`
        );
      } else {
        log.warn(
          `⚠️ Chat ${chat.chatName} (${chat.chatId}) is inactive, skipping`
        );
      }
    }

    if (activeChatsCount === 0) {
      log.warn(
        "⚠️ No active target chats found! Proactive service will not run."
      );
      log.warn(
        "⚠️ Set isActive=true for at least one chat in agents.config.ts"
      );
    } else {
      log.info(`✅ Service started with ${activeChatsCount} active chat(s)`);
      log.info(
        `✅ Proactive mode is ACTIVE - will send photos every ${intervalMinutes} minutes`
      );
    }
  }

  /**
   * Остановка сервиса
   */
  async stop(): Promise<void> {
    // Останавливаем все таймеры
    for (const [chatId, state] of this.stateByChat) {
      if (state.timerId) {
        clearInterval(state.timerId);
        state.isActive = false;
        log.info(`Stopped proactive loop for chat ${chatId}`);
      }
    }

    this.stateByChat.clear();
    this.isInitialized = false;
    log.info("Service stopped");
  }

  /**
   * Запустить проактивный цикл для чата
   */
  startProactiveLoop(chatId: string, intervalMinutes: number): void {
    // Проверяем, не запущен ли уже таймер
    const existingState = this.stateByChat.get(chatId);
    if (existingState?.isActive) {
      log.warn(`Proactive loop already running for chat ${chatId}`);
      return;
    }

    // Создаём состояние
    const state: ProactiveState = {
      processedUsers: new Set(),
      lastSentTime: null,
      isActive: true,
      timerId: null,
    };

    // Конвертируем минуты в миллисекунды
    const intervalMs =
      Math.max(intervalMinutes, MIN_INTERVAL_MINUTES) * 60 * 1000;

    // Запускаем таймер (БЕЗ немедленного выполнения - только по расписанию)
    state.timerId = setInterval(async () => {
      await this.executeProactiveAction(chatId);
    }, intervalMs);

    this.stateByChat.set(chatId, state);

    // Начальная задержка 2 минуты для избежания rate limit при старте
    const initialDelayMs = 2 * 60 * 1000; // 2 минуты
    setTimeout(async () => {
      log.info(
        `Initial proactive execution for chat ${chatId} (after ${initialDelayMs / 1000} sec delay)`
      );
      await this.executeProactiveAction(chatId);
    }, initialDelayMs);

    log.info(
      `Proactive loop started for chat ${chatId}, interval: ${intervalMinutes} min (first in ${initialDelayMs / 1000} sec, then every ${intervalMinutes} min)`
    );
  }

  /**
   * Выполнить проактивное действие (генерация и отправка креативного фото)
   */
  async executeProactiveAction(chatId: string): Promise<void> {
    if (!this.runtime) {
      log.error("Runtime not available");
      return;
    }

    const state = this.stateByChat.get(chatId);
    if (!state || !state.isActive) {
      log.warn(`No active state for chat ${chatId}`);
      return;
    }

    log.info(`Executing proactive action for chat ${chatId}`);

    try {
      // Получаем сервисы
      const telegram =
        this.runtime.getService<TelegramService>("telegram-craft");
      const nanoBanana =
        this.runtime.getService<NanoBananaService>("nano-banana");

      if (!telegram) {
        log.error("TelegramService not available");
        return;
      }
      log.info("TelegramService is available");

      if (!nanoBanana || !nanoBanana.isAvailable()) {
        log.error("NanoBananaService not available");
        return;
      }
      log.info("NanoBananaService is available");

      // Получаем ID бота, чтобы исключить его из выборки
      const botUser = await telegram.getMe();
      const botId = botUser?.id?.toString() || "";
      log.info(`Bot ID: ${botId}`);

      // Получаем участников группы
      log.info(`Getting group members for chat ${chatId}...`);
      const members = await telegram.getGroupMembers(chatId, 100);
      if (members.length === 0) {
        log.warn(
          `⚠️ No members found in chat ${chatId}. Chat might be empty or inaccessible.`
        );
        return;
      }

      log.info(`✅ Found ${members.length} members in chat ${chatId}`);

      // Фильтруем: исключаем уже обработанных, тех у кого нет username, и самого бота
      const availableMembers = members.filter(
        (m) =>
          m.username &&
          !state.processedUsers.has(m.id.toString()) &&
          m.id.toString() !== botId // Исключаем бота
      );

      log.info(
        `📊 Filtering stats: ${members.length} total members, ${availableMembers.length} available (with username, not processed, not bot)`
      );
      log.info(`📊 Processed users count: ${state.processedUsers.size}`);

      if (availableMembers.length === 0) {
        // Сбрасываем список обработанных, начинаем заново
        log.info(
          `All members processed (${state.processedUsers.size} total), resetting list`
        );
        state.processedUsers.clear();
        return;
      }

      log.info(
        `Found ${availableMembers.length} available members (with username, not processed, not bot)`
      );

      // Пробуем найти пользователя с аватаркой И человеком на ней (только ДЕВОЧКИ!)
      // Увеличиваем количество попыток, так как фильтруем только женский пол
      let selectedUser: ITelegramUser | null = null;
      let avatarDataUrl: string | null = null;
      let detectedGender: "male" | "female" | "unknown" = "unknown";
      const maxAttempts = Math.min(30, availableMembers.length); // Увеличили до 30 попыток

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Выбираем случайного участника
        const randomIndex = Math.floor(Math.random() * availableMembers.length);
        const candidate = availableMembers[randomIndex];

        log.info(
          `🔍 Attempt ${attempt + 1}/${maxAttempts}: Trying user ${candidate.firstName || candidate.username} (${candidate.id}), username: ${candidate.username || "none"}`
        );

        // Получаем аватарку
        log.info(
          `📸 Getting avatar for user ${candidate.id} (${candidate.firstName || candidate.username})...`
        );
        const candidateAvatar = await telegram.getUserAvatar(
          candidate.id.toString()
        );
        if (!candidateAvatar) {
          log.warn(`⚠️ User ${candidate.id} has no avatar, trying next...`);
          state.processedUsers.add(candidate.id.toString());
          availableMembers.splice(randomIndex, 1);
          if (availableMembers.length === 0) {
            log.info("No more available members with avatars");
            return;
          }
          continue;
        }
        log.info(
          `✅ Got avatar for user ${candidate.id}, size: ${candidateAvatar.length} chars`
        );

        // Определяем пол по имени (быстрая проверка перед CV анализом)
        const nameBasedGender = detectGenderByName(
          candidate.firstName || "",
          candidate.lastName,
          candidate.username
        );
        if (nameBasedGender === "male") {
          log.info(
            `User ${candidate.firstName || candidate.id} detected as MALE by name, skipping (females only)`
          );
          state.processedUsers.add(candidate.id.toString());
          availableMembers.splice(randomIndex, 1);
          if (availableMembers.length === 0) {
            log.info("No more available members");
            return;
          }
          continue;
        }

        // НОВОЕ: Анализируем аватарку через YOLO + LLaVA
        if (this.avatarAnalysis) {
          log.info(`Analyzing avatar for user ${candidate.id}...`);
          const analysis = await this.avatarAnalysis.analyze(candidateAvatar);

          if (!analysis.hasHuman) {
            log.info(
              `User ${candidate.firstName || candidate.id} has no human on avatar, skipping`
            );
            state.processedUsers.add(candidate.id.toString());
            availableMembers.splice(randomIndex, 1);
            if (availableMembers.length === 0) {
              log.info("No more available members with human avatars");
              return;
            }
            continue;
          }

          // Сохраняем определённый пол из CV анализа
          detectedGender = analysis.gender;
          log.info(
            `Avatar analysis: hasHuman=true, gender=${analysis.gender} (confidence: ${analysis.confidence}%)`
          );

          // СТРАТЕГИЯ: ТОЛЬКО ДЕВОЧКИ! Пропускаем мужчин
          if (detectedGender === "male") {
            log.info(
              `User ${candidate.firstName || candidate.id} detected as MALE by CV analysis, skipping (females only)`
            );
            state.processedUsers.add(candidate.id.toString());
            availableMembers.splice(randomIndex, 1);
            if (availableMembers.length === 0) {
              log.info("No more available female members");
              return;
            }
            continue;
          }
        } else {
          // Если CV анализ недоступен, используем только определение по имени
          if (nameBasedGender !== "female") {
            log.info(
              `User ${candidate.firstName || candidate.id} not detected as FEMALE, skipping (females only)`
            );
            state.processedUsers.add(candidate.id.toString());
            availableMembers.splice(randomIndex, 1);
            if (availableMembers.length === 0) {
              log.info("No more available female members");
              return;
            }
            continue;
          }
          detectedGender = "female";
        }

        // Пользователь подходит! (только девочки дошли до этого места)
        selectedUser = candidate;
        avatarDataUrl = candidateAvatar;
        log.info(`Got valid FEMALE avatar for user ${candidate.id}`);
        break;
      }

      if (!selectedUser || !avatarDataUrl) {
        log.warn(
          `Could not find any FEMALE user with valid avatar after ${maxAttempts} attempts. Processed ${state.processedUsers.size} users.`
        );
        log.warn(
          `This might mean: 1) No female users in chat, 2) All females already processed, 3) No females have avatars with humans`
        );
        return;
      }

      log.info(
        `Selected user: ${selectedUser.firstName || selectedUser.username} (${selectedUser.id}), detected gender: ${detectedGender}`
      );

      // ============================================
      // FREEMIUM: Проверка лимита бесплатных фото
      // ============================================
      const paymentService = this.runtime.getService<PaymentService>("payment");
      const userId = selectedUser.id.toString();

      if (paymentService && !paymentService.hasFreePhotosRemaining(userId)) {
        // Лимит бесплатных фото исчерпан - показываем кнопку оплаты
        log.info(
          `User ${userId} has no free photos remaining, showing payment button`
        );

        // Уведомляем владельца о paywall
        paymentService
          .notifyOwner("paywall", {
            userId,
            username: selectedUser.username,
            firstName: selectedUser.firstName,
            chatId,
          })
          .catch((err) =>
            log.error("Failed to notify owner about paywall", err)
          );

        const remaining = paymentService.getFreePhotosRemaining(userId);
        const used = paymentService.getFreePhotosUsed(userId);

        // Создаём ссылку на инвойс (для групп нельзя sendInvoice, только ссылка)
        const invoiceLink = await paymentService.createInvoiceLink(
          PRICES.PERSONAL_PHOTO,
          userId
        );

        const paymentCaption = `@${selectedUser.username || selectedUser.firstName}, ваш лимит бесплатных фото (${FREE_PHOTOS_LIMIT} шт.) исчерпан.

Стоимость персонального AI-портрета: ${PRICES.PERSONAL_PHOTO} ⭐`;

        // Отправляем сообщение с URL-кнопкой оплаты
        if (invoiceLink) {
          await telegram.sendMessageWithUrlButtons(chatId, paymentCaption, [
            [
              {
                text: `Заказать (${PRICES.PERSONAL_PHOTO} ⭐)`,
                url: invoiceLink,
              },
            ],
          ]);
        } else {
          await telegram.sendMessage(chatId, paymentCaption);
        }

        // Помечаем пользователя как обработанного
        state.processedUsers.add(userId);
        state.lastSentTime = new Date();
        return;
      }

      // Логируем статус бесплатных фото
      if (paymentService) {
        const remaining = paymentService.getFreePhotosRemaining(userId);
        log.info(
          `User ${userId} has ${remaining}/${FREE_PHOTOS_LIMIT} free photos remaining`
        );
      }

      // Получаем сообщения пользователя для персонализации промпта
      const userMessages = await this.getUserMessagesFromChat(
        chatId,
        selectedUser.id.toString(),
        200
      );

      // Генерируем персонализированный промпт на основе сообщений
      const prompt = await this.generatePersonalizedPrompt(
        selectedUser,
        userMessages,
        detectedGender
      );

      // Подготавливаем массив изображений для Nano Banana Pro
      // ИСПОЛЬЗУЕМ ТОЛЬКО snow-girl.jpg как референс (без аватарки пользователя)
      // Это позволит генерировать разные позы и ракурсы, сохраняя стиль из snow-girl.jpg
      const imagesForGeneration: string[] = [];

      // Добавляем ТОЛЬКО референсное изображение стиля (snow-girl.jpg)
      const styleReference = this.getStyleReferenceImage();
      if (styleReference) {
        imagesForGeneration.push(styleReference);
        log.info(
          `✅ Using ONLY style reference image (snow-girl.jpg) for generation, size: ${styleReference.length} chars`
        );
        log.info(
          `📸 Style reference (snow-girl.jpg) will be used for: visual style, color palette, lighting, composition, and overall aesthetic`
        );
      } else {
        log.warn(
          "⚠️ Style reference image not available! Check if assets/snow-girl.jpg exists. Generating without style reference."
        );
      }

      // Добавляем аватарку пользователя ВТОРЫМ (для прически и лица)
      if (!avatarDataUrl) {
        log.error(
          "❌ avatarDataUrl is null or undefined! Cannot add user avatar to generation."
        );
        return;
      }
      imagesForGeneration.push(avatarDataUrl);
      log.info(
        `✅ Using user avatar as SECOND image for hairstyle and face preservation, size: ${avatarDataUrl.length} chars`
      );
      log.info(
        `📊 Total images in array: ${imagesForGeneration.length} (should be 2: [snow-girl.jpg, user avatar])`
      );

      // Обновляем промпт, чтобы явно указать на применение стиля из референса
      // ВАЖНО:
      // - Первое изображение (snow-girl.jpg) - для стиля, цветов, освещения, композиции
      // - Второе изображение (аватарка клиента) - для прически и лица
      // - Поза тела и рук - генерируются по промпту (разные каждый раз)
      let enhancedPrompt = prompt;
      if (styleReference) {
        // УСИЛЕННЫЙ промпт с явными инструкциями для Nano Banana Pro
        enhancedPrompt = `STYLE REFERENCE: Use the FIRST image (snow-girl.jpg) as the PRIMARY style reference. Apply its visual style, color palette, lighting conditions, composition, background atmosphere, clothing style, and overall aesthetic mood. FACE REFERENCE: Use the SECOND image (user avatar) ONLY for the person's face features and hairstyle - copy the exact face structure, eyes, nose, mouth, and hair from the second image. BODY POSE: Generate a NEW body pose, arm positions, and camera angle as described in the prompt - each photo must have different hand positions and body posture. ${prompt}`;
        log.info(
          "Enhanced prompt: STRONG style transfer from snow-girl.jpg (1st image), face/hairstyle from user avatar (2nd image), new body poses"
        );
      }

      log.info(`Using prompt: "${enhancedPrompt.substring(0, 80)}..."`);
      log.info(
        `Using ${imagesForGeneration.length} images: [snow-girl.jpg (style), user avatar (hairstyle & face)]`
      );

      // Генерируем креативное фото через Nano Banana Pro
      // Nano Banana Pro:
      // - Первое изображение (snow-girl.jpg) - для стиля, цветов, освещения, композиции
      // - Второе изображение (аватарка клиента) - для прически и лица
      // - Поза тела и рук генерируются по промпту (разные каждый раз)
      log.info(
        `Starting image generation with ${imagesForGeneration.length} images: [snow-girl.jpg (style), user avatar (hairstyle & face)]`
      );
      const result = await nanoBanana.generate({
        prompt: enhancedPrompt,
        images: imagesForGeneration,
        aspectRatio: "9:16", // Вертикальный формат для Instagram/Stories
        resolution: "2K",
        outputFormat: "jpg", // JPG меньше по размеру, лучше для Telegram
        negativePrompt: DEFAULT_NEGATIVE_PROMPT, // Убираем AI-артефакты
        model: "nano-banana", // Nano Banana Pro применяет стиль из первого изображения, лицо из второго
      });

      if (!result.success || !result.imageUrl) {
        log.error(`❌ Failed to generate creative photo: ${result.error}`);
        log.error(
          `Generation failed for user ${selectedUser.username || selectedUser.id} in chat ${chatId}`
        );

        // Если это rate limit, не помечаем пользователя как обработанного
        // чтобы попробовать снова в следующий раз
        if (
          result.error?.includes("Rate limit") ||
          result.error?.includes("429")
        ) {
          log.warn(
            `⚠️ Rate limit encountered, user ${selectedUser.id} will be retried in next cycle`
          );
          log.warn(
            `💡 Tip: Increase proactiveIntervalMinutes in agents.config.ts to reduce rate limit issues`
          );
          // НЕ добавляем в processedUsers, чтобы попробовать снова
        } else {
          // Для других ошибок помечаем как обработанного
          state.processedUsers.add(selectedUser.id.toString());
        }
        return;
      }

      log.info(
        `✅ Generated creative photo successfully: ${result.imageUrl?.substring(0, 100)}...`
      );

      // Формируем УНИКАЛЬНЫЙ персональный caption через LLM
      const baseCaption = await this.generatePersonalizedCaption(
        selectedUser,
        userMessages,
        prompt
      );

      // Добавляем рекламу бота в конец caption
      const botPromo = getRandomBotPromo();
      const caption = `${baseCaption}\n\n${botPromo}`;

      // Отправляем фото как изображение (видимое сразу в чате)
      log.info(
        `Attempting to send photo to chat ${chatId}, imageUrl: ${result.imageUrl?.substring(0, 100)}...`
      );
      log.info(`Caption length: ${caption.length} chars`);

      const sendResult = await telegram.sendPhoto(
        chatId,
        result.imageUrl,
        caption
      );

      log.info(
        `Send photo result: success=${sendResult.success}, error=${sendResult.error || "none"}`
      );

      if (sendResult.success) {
        log.info(
          `✅ Successfully sent creative photo to chat ${chatId} for user ${selectedUser.username}`
        );

        // FREEMIUM: Увеличиваем счётчик использованных бесплатных фото
        if (paymentService) {
          // Проверяем, первая ли это генерация для пользователя
          const freeUsedBefore = paymentService.getFreePhotosUsed(userId);
          if (freeUsedBefore === 0) {
            // Уведомляем владельца о новом пользователе
            paymentService
              .notifyOwner("new_user", {
                userId,
                username: selectedUser.username,
                firstName: selectedUser.firstName,
                chatId,
              })
              .catch((err) =>
                log.error("Failed to notify owner about new user", err)
              );
          }

          paymentService.incrementFreePhotos(userId);
          const remaining = paymentService.getFreePhotosRemaining(userId);
          log.info(
            `User ${userId} used a free photo, ${remaining}/${FREE_PHOTOS_LIMIT} remaining`
          );
        }

        // Обновляем состояние
        state.processedUsers.add(selectedUser.id.toString());
        state.lastSentTime = new Date();
      } else {
        log.error(
          `❌ Failed to send photo to chat ${chatId}: ${sendResult.error}`
        );
        log.error(`Photo URL was: ${result.imageUrl?.substring(0, 100)}...`);
        log.error(`Caption length: ${caption.length} chars`);
      }
    } catch (error: any) {
      log.error("❌ Error executing proactive action", error);
      log.error(`Error details: ${error?.message || error}`);
      log.error(`Stack: ${error?.stack || "no stack"}`);
    }
  }

  /**
   * Получить сообщения пользователя из чата
   * @param chatId - ID чата
   * @param userId - ID пользователя
   * @param limit - максимальное количество сообщений для анализа
   * @returns массив текстов сообщений пользователя
   */
  private async getUserMessagesFromChat(
    chatId: string,
    userId: string,
    limit: number = 200
  ): Promise<string[]> {
    if (!this.runtime) {
      log.warn("Runtime not available for getUserMessagesFromChat");
      return [];
    }

    try {
      const telegram =
        this.runtime.getService<TelegramService>("telegram-craft");
      if (!telegram) {
        log.warn("TelegramService not available");
        return [];
      }

      // Получаем последние сообщения из чата
      const messages = await telegram.getMessages(chatId, limit);
      log.info(`Retrieved ${messages.length} messages from chat ${chatId}`);

      // Фильтруем сообщения конкретного пользователя
      const userMessages = messages
        .filter(
          (msg) => msg.fromId === userId && msg.text && msg.text.length > 3
        )
        .map((msg) => msg.text)
        .slice(0, 50); // Берём максимум 50 сообщений для анализа

      log.info(`Found ${userMessages.length} messages from user ${userId}`);
      return userMessages;
    } catch (error) {
      log.error("Error getting user messages", error);
      return [];
    }
  }

  /**
   * Сгенерировать персонализированный промпт на основе сообщений пользователя
   * Анализирует диалоги и извлекает интересы, хобби, профессию для креативного портрета
   *
   * @param user - информация о пользователе
   * @param userMessages - сообщения пользователя
   * @param overrideGender - пол из CV анализа (если есть)
   * @returns персонализированный промпт или базовый промпт если не удалось
   */
  private async generatePersonalizedPrompt(
    user: ITelegramUser,
    userMessages: string[],
    overrideGender?: "male" | "female" | "unknown"
  ): Promise<string> {
    // Определяем пол: сначала CV анализ, потом по имени + username (через библиотеку sex-by-russian-name)
    const nameBasedGender = detectGenderByName(
      user.firstName || "",
      user.lastName,
      user.username
    );
    const gender =
      overrideGender && overrideGender !== "unknown"
        ? overrideGender
        : nameBasedGender;
    log.info(
      `Using gender: ${gender} (CV: ${overrideGender || "none"}, name-based: ${nameBasedGender})`
    );
    // СТРАТЕГИЯ: ТОЛЬКО ДЕВОЧКИ! Всегда используем женские промпты
    const genderPrompts = FEMALE_PROMPTS;
    const genderWord = "woman";
    const genderRu = "девушка";

    // Если нет сообщений или runtime - возвращаем случайный женский промпт
    if (!this.runtime || userMessages.length < 3) {
      const promptIndex = Math.floor(Math.random() * genderPrompts.length);
      log.info(
        `Using female fallback prompt (${userMessages.length} messages)`
      );
      return genderPrompts[promptIndex];
    }

    try {
      const userName = user.firstName || user.username || "пользователь";

      // Формируем LLM промпт для ГЛУБОКОГО анализа интересов в СТИЛЕ MIDJOURNEY
      const llmPrompt = `Проанализируй сообщения пользователя и создай УНИКАЛЬНЫЙ промпт в формате MIDJOURNEY для AI-портрета.

СООБЩЕНИЯ ПОЛЬЗОВАТЕЛЯ "${userName}" (${genderRu}):
${userMessages.slice(0, 25).join("\n")}

ЗАДАЧА:
1. Определи ГЛАВНЫЕ ИНТЕРЕСЫ человека (работа, хобби, увлечения)
2. Найди КЛЮЧЕВЫЕ ТЕМЫ которые он обсуждает
3. Пойми его ХАРАКТЕР и ЭНЕРГЕТИКУ (спокойный/энергичный, серьёзный/весёлый)
4. Создай промпт для портрета который ОТРАЖАЕТ его личность

ФОРМУЛА MIDJOURNEY ПРОМПТА:
[Subject] + [Details] + [Style] + [Lighting] + [Mood] + [Parameters]

ВАЖНО: ВСЕГДА добавляй РАЗНЫЕ ПОЗЫ ТЕЛА И РУК! Не делай только портреты лицом к камере!

ПОЗЫ ТЕЛА (выбирай случайно, РАЗНЫЕ каждый раз):
- Стоя: "standing", "walking", "leaning against", "turning back", "looking over shoulder"
- Сидя: "sitting on edge", "sitting cross-legged", "sitting on windowsill", "reclining"
- Динамичные: "in motion", "dancing", "reaching up", "stretching", "mid-stride"
- Лежа: "lying on side", "reclining", "propped on elbow"

ПОЛОЖЕНИЯ РУК (выбирай РАЗНЫЕ каждый раз, обязательно указывай!):
- "arms crossed", "one hand on hip", "both hands behind head", "arms raised", "one hand touching hair", "hands in pockets", "one arm extended", "both arms at sides", "one hand on face", "arms folded", "one hand pointing", "hands clasped together", "one hand on shoulder", "arms open wide"

РАКУРСЫ (выбирай случайно):
- "three-quarter view" (3/4)
- "profile view" (сбоку)
- "looking over shoulder" (через плечо)
- "from high angle" (сверху)
- "from low angle" (снизу)
- "looking away" (смотрит в сторону)
- "turning back" (поворачивается назад)

ПЛАНЫ (выбирай случайно):
- "full body shot" (во весь рост)
- "three-quarter body" (по колени)
- "medium shot" (по пояс)
- "close-up" (крупный план - только иногда!)

ОБЯЗАТЕЛЬНО: В каждом промпте указывай КОНКРЕТНОЕ положение рук и позу тела!

ПРИМЕРЫ ПЕРСОНАЛИЗАЦИИ В MIDJOURNEY СТИЛЕ С РАЗНЫМИ ПОЗАМИ ТЕЛА И РУК:
- Если человек про IT/код → "Confident ${genderWord} software developer standing in modern co-working space, leaning against desk, one hand on hip, other hand holding laptop, looking at camera with three-quarter view, ambient neon lighting, tech startup vibes, full body shot, editorial photography, shot on Canon 85mm f/1.4, shallow depth of field, 8K quality --ar 9:16 --s 250 --v 7"
- Если про путешествия → "Adventurous ${genderWord} traveler standing in exotic location, backpack on shoulder, one arm extended pointing forward, looking over shoulder at camera, walking pose, dramatic sunset lighting, travel photography, vibrant colors, shot on Sony A7R IV, wide angle lens, full body composition --ar 9:16 --s 500 --v 7"
- Если про спорт/фитнес → "Athletic ${genderWord} in dynamic stretching pose, both arms raised high above head, reaching up, looking upward, gym or outdoor setting, energetic lighting, motion blur background, sports photography, shot on Canon 5D Mark IV, 85mm lens, three-quarter body shot --ar 9:16 --s 300 --v 7"
- Если про искусство/музыку → "Artistic ${genderWord} sitting on windowsill, one hand touching hair, other hand resting on knee, looking outside, profile view, bohemian setting, creative lighting, artistic atmosphere, film grain texture, shot on Hasselblad, medium format, shallow depth of field --ar 9:16 --s 750 --v 7"
- Если про бизнес/деньги → "Powerful executive ${genderWord} standing confidently, arms crossed, looking at camera from low angle, luxury setting, dramatic studio lighting, high-end fashion, full body shot, shot on Canon 85mm f/1.2, corporate photography style --ar 9:16 --s 200 --v 7"
- Если про еду/кулинарию → "Warm cozy ${genderWord} sitting at kitchen table, both hands holding cup, leaning forward, three-quarter view, natural window light, lifestyle photography, inviting atmosphere, shot on Nikon 85mm f/1.4, golden hour, medium shot --ar 9:16 --s 250 --v 7"
- Если про моду/красоту → "High fashion ${genderWord} standing elegantly, one hand on hip, other hand touching face, turning back, looking over shoulder, glamorous setting, editorial lighting, Vogue style, luxury aesthetic, full body shot, shot on Canon 85mm f/1.4, magazine quality --ar 9:16 --s 500 --v 7"
- Если про природу/животных → "Natural outdoor portrait of ${genderWord} walking through nature, arms swinging naturally, one hand reaching out to touch leaves, looking away, three-quarter view, soft organic lighting, environmental portrait, peaceful atmosphere, full body shot, shot on Canon 85mm f/1.4, shallow depth of field --ar 9:16 --s 300 --v 7"

ОБЯЗАТЕЛЬНО В ПРОМПТЕ (MIDJOURNEY ФОРМАТ):
- Субъект: ${genderWord} (в начале промпта)
- Детали: описание окружения, аксессуаров, связанных с хобби
- Стиль: photorealistic, shot on Canon/Sigma/Sony 85mm f/1.4, 8K quality
- Освещение: dramatic/soft/golden hour/studio lighting
- Атмосфера: описание настроения и визуального стиля
- Параметры: --ar 9:16 --s 250-750 --v 7 (ОБЯЗАТЕЛЬНО в конце!)

СТРУКТУРА MIDJOURNEY ПРОМПТА:
1. Subject (кто) - в начале
2. Details (что, где) - описание сцены
3. Style (как) - техника съёмки, камера, объектив
4. Lighting (освещение) - тип света
5. Mood (настроение) - атмосфера
6. Parameters (--ar, --s, --v) - ВСЕГДА в конце!

ФОРМАТ ОТВЕТА:
Верни ТОЛЬКО промпт на АНГЛИЙСКОМ языке в формате Midjourney (с параметрами в конце), например:
"Confident ${genderWord} software developer in modern co-working space, laptop nearby, ambient neon lighting, tech startup vibes, editorial photography, shot on Canon 85mm f/1.4, shallow depth of field, 8K quality --ar 9:16 --s 250 --v 7"

ВАЖНО:
- Промпт должен быть детальным и описательным (Midjourney стиль)
- Параметры --ar 9:16 --s [250-750] --v 7 ОБЯЗАТЕЛЬНО в конце
- Используй конкретные камеры и объективы (Canon 85mm, Sony A7R IV, Hasselblad)
- Добавь технические детали (shallow depth of field, 8K quality, film grain)

ПРОМПТ:`;

      log.info(
        `Generating personalized female prompt based on interests for ${userName}...`
      );

      // Вызываем LLM через runtime (правильный формат ElizaOS 1.6+)
      const result = await this.runtime.useModel(ModelType.TEXT_SMALL, {
        prompt: llmPrompt,
        maxTokens: 200,
        temperature: 0.8, // Выше для креативности
      });

      if (result && typeof result === "string" && result.length > 30) {
        let prompt = result.trim();
        // Убираем кавычки если LLM их добавил
        prompt = prompt.replace(/^["']|["']$/g, "");

        // Проверяем наличие Midjourney параметров, если нет - добавляем
        if (
          !prompt.includes("--ar") &&
          !prompt.includes("--s") &&
          !prompt.includes("--v")
        ) {
          log.warn(
            "Generated prompt missing Midjourney parameters, adding defaults"
          );
          prompt = `${prompt} --ar 9:16 --s 250 --v 7`;
        }

        log.info(
          `Generated Midjourney-style prompt: "${prompt.substring(0, 80)}..."`
        );
        return prompt;
      }

      log.warn("LLM returned empty or invalid response, using fallback prompt");
    } catch (error) {
      log.error("Error generating personalized prompt", error);
    }

    // Fallback к женскому промпту (только девочки!)
    const promptIndex = Math.floor(Math.random() * genderPrompts.length);
    return genderPrompts[promptIndex];
  }

  /**
   * Сгенерировать уникальный персональный caption для фото через LLM
   * @param user - информация о пользователе
   * @param userMessages - сообщения пользователя для анализа стиля
   * @param imagePrompt - промпт который использовался для генерации (для контекста)
   * @returns уникальный caption или fallback
   */
  private async generatePersonalizedCaption(
    user: ITelegramUser,
    userMessages: string[],
    imagePrompt: string
  ): Promise<string> {
    if (!this.runtime) {
      return getFallbackPromoMessage(user.username || user.firstName || "друг");
    }

    const userName = user.firstName || user.username || "друг";
    const userTag = user.username ? `@${user.username}` : userName;
    const gender = detectGenderByName(
      user.firstName || "",
      user.lastName,
      user.username
    );
    const genderRu = gender === "female" ? "она" : "он";
    log.info(`Caption gender for ${userName} (@${user.username}): ${gender}`);

    try {
      // Анализируем стиль общения пользователя
      const userStyle =
        userMessages.length > 3
          ? userMessages.slice(0, 10).join(" ").substring(0, 500)
          : "";

      // Генерируем случайный стиль для разнообразия
      const styles = [
        "деловой и лаконичный",
        "дружелюбный и тёплый",
        "интригующий и загадочный",
        "простой и прямой",
        "элегантный и стильный",
      ];
      const randomStyle = styles[Math.floor(Math.random() * styles.length)];

      const llmPrompt = `Напиши УНИКАЛЬНУЮ подпись к AI-портрету для ${userTag}.

ЗАДАЧА: Создать подпись в стиле "${randomStyle}".

СТРУКТУРА (2 короткие строки):
1. Обращение к ${userTag} + мысль о портрете
2. Приглашение продолжить в ЛС

ВАРИАНТЫ ПОДХОДОВ (выбери один и адаптируй):
- Комплимент результату: "Отлично вышло", "Интересный ракурс"
- Вопрос: "Как вам?", "Нравится?"
- Факт: "Ваш портрет готов", "Результат перед вами"
- Предложение: "Можем поэкспериментировать", "Есть идеи для продолжения"

ПРИМЕРЫ РАЗНЫХ СТИЛЕЙ:

Деловой:
"${userTag}, портрет готов.
Детали обсудим в личных сообщениях."

Дружелюбный:
"${userTag}, как вам результат?
Если хотите что-то изменить — пишите в ЛС."

Интригующий:
"${userTag}, это только начало.
Продолжение — в личных сообщениях."

Простой:
"${userTag}, вот что получилось.
Ещё варианты — в ЛС."

Элегантный:
"${userTag}, ваш AI-образ.
За новыми работами — добро пожаловать в личные сообщения."

ПРАВИЛА:
- Каждый раз пиши НОВЫЙ текст (не копируй примеры!)
- На "вы", без эмодзи
- Спокойно, без "вау/круто/огонь"

Верни ТОЛЬКО текст (2 строки):`;

      log.info(
        `Generating personalized caption for ${userName} in style: "${randomStyle}"`
      );

      // Вызываем LLM через runtime (правильный формат ElizaOS 1.6+)
      const result = await this.runtime.useModel(ModelType.TEXT_SMALL, {
        prompt: llmPrompt,
        maxTokens: 150,
        temperature: 0.9, // Высокая температура для разнообразия
      });

      if (result && typeof result === "string" && result.length > 5) {
        // Просто чистим результат, без добавления рекламы
        const caption = result.trim().replace(/^["']|["']$/g, "");
        log.info(`Generated personalized caption: "${caption}"`);
        return caption;
      }

      log.warn("LLM returned empty caption, using fallback");
    } catch (error) {
      log.error("Error generating personalized caption", error);
    }

    return getFallbackPromoMessage(user.username || user.firstName || "друг");
  }

  /**
   * Получить статистику по чату
   */
  getStats(chatId: string): {
    processedCount: number;
    lastSent: Date | null;
    isActive: boolean;
  } | null {
    const state = this.stateByChat.get(chatId);
    if (!state) return null;

    return {
      processedCount: state.processedUsers.size,
      lastSent: state.lastSentTime,
      isActive: state.isActive,
    };
  }

  /**
   * Принудительно выполнить проактивное действие (для тестирования)
   */
  async forceExecute(chatId: string): Promise<void> {
    await this.executeProactiveAction(chatId);
  }

  /**
   * Проверка доступности сервиса
   */
  isAvailable(): boolean {
    return this.isInitialized && this.runtime !== null;
  }

  // ============================================
  // PAYMENT: Генерация фото после оплаты
  // ============================================

  /**
   * Генерация персонального фото для оплатившего пользователя
   * Вызывается из PaymentService после successful_payment
   *
   * @param chatId - ID чата (куда отправить результат)
   * @param userId - ID пользователя (telegram ID)
   */
  async generateForPaidUser(chatId: string, userId: string): Promise<void> {
    if (!this.runtime) {
      log.error("Runtime not available for generateForPaidUser");
      return;
    }

    log.info(`Generating paid photo for user ${userId} in chat ${chatId}`);

    try {
      // Получаем сервисы
      const telegram =
        this.runtime.getService<TelegramService>("telegram-craft");
      const nanoBanana =
        this.runtime.getService<NanoBananaService>("nano-banana");

      if (!telegram) {
        log.error("TelegramService not available");
        return;
      }

      if (!nanoBanana || !nanoBanana.isAvailable()) {
        log.error("NanoBananaService not available");
        return;
      }

      // Получаем информацию о пользователе через GramJS
      const userEntity = await telegram.getEntity(userId);
      if (!userEntity) {
        log.error(`Could not get entity for user ${userId}`);
        return;
      }

      const user: ITelegramUser = {
        id: parseInt(userId),
        firstName: userEntity.firstName || "",
        lastName: userEntity.lastName,
        username: userEntity.username,
      };

      // Получаем аватарку пользователя
      const avatarDataUrl = await telegram.getUserAvatar(userId);
      if (!avatarDataUrl) {
        log.warn(`User ${userId} has no avatar, sending message`);
        await telegram.sendMessage(
          chatId,
          `Благодарим за оплату. К сожалению, у вас не установлена аватарка. Пожалуйста, добавьте фото профиля в Telegram и напишите мне снова.`
        );
        return;
      }

      // Анализируем аватарку через YOLO + LLaVA
      let detectedGender: "male" | "female" | "unknown" = "unknown";

      // Определяем пол по имени (быстрая проверка)
      const nameBasedGender = detectGenderByName(
        user.firstName || "",
        user.lastName,
        user.username
      );
      if (nameBasedGender === "male") {
        log.warn(
          `Paid user ${userId} detected as MALE by name, service is females-only`
        );
        await telegram.sendMessage(
          chatId,
          `Извините, в данный момент сервис доступен только для девочек.`
        );
        return;
      }

      if (this.avatarAnalysis) {
        log.info(`Analyzing avatar for paid user ${userId}...`);
        const analysis = await this.avatarAnalysis.analyze(avatarDataUrl);

        if (!analysis.hasHuman) {
          log.warn(`Paid user ${userId} has no human on avatar`);
          await telegram.sendMessage(
            chatId,
            `На вашей аватарке не обнаружено лицо. Пожалуйста, установите фото с вашим портретом и попробуйте снова.`
          );
          return;
        }

        detectedGender = analysis.gender;
        log.info(
          `Paid user avatar analysis: gender=${analysis.gender} (confidence: ${analysis.confidence}%)`
        );

        // СТРАТЕГИЯ: ТОЛЬКО ДЕВОЧКИ!
        if (detectedGender === "male") {
          log.warn(
            `Paid user ${userId} detected as MALE by CV analysis, service is females-only`
          );
          await telegram.sendMessage(
            chatId,
            `Извините, в данный момент сервис доступен только для девочек.`
          );
          return;
        }
      } else {
        // Если CV анализ недоступен, используем только определение по имени
        if (nameBasedGender !== "female") {
          log.warn(
            `Paid user ${userId} not detected as FEMALE, service is females-only`
          );
          await telegram.sendMessage(
            chatId,
            `Извините, в данный момент сервис доступен только для девочек.`
          );
          return;
        }
        detectedGender = "female";
      }

      // Получаем сообщения пользователя для персонализации
      const userMessages = await this.getUserMessagesFromChat(
        chatId,
        userId,
        200
      );

      // Генерируем персонализированный промпт с учётом CV-определённого пола
      const prompt = await this.generatePersonalizedPrompt(
        user,
        userMessages,
        detectedGender
      );

      // Подготавливаем массив изображений для Nano Banana Pro
      // ВАЖНО: Первое изображение - snow-girl.jpg (стиль), второе - аватарка клиента (прическа и лицо)
      const imagesForGeneration: string[] = [];

      // Добавляем референсное изображение стиля ПЕРВЫМ (snow-girl.jpg)
      const styleReference = this.getStyleReferenceImage();
      if (styleReference && detectedGender === "female") {
        imagesForGeneration.push(styleReference);
        log.info(
          "Using style reference image (snow-girl.jpg) as FIRST image for style"
        );
        log.info(
          "Style reference (snow-girl.jpg) will be used for: visual style, color palette, lighting, composition"
        );
      }

      // Добавляем аватарку пользователя ВТОРЫМ (для прически и лица)
      imagesForGeneration.push(avatarDataUrl);
      log.info(
        "Using user avatar as SECOND image for hairstyle and face preservation"
      );

      // Обновляем промпт, чтобы явно указать на применение стиля из референса
      // ВАЖНО:
      // - Первое изображение (snow-girl.jpg) - для стиля, цветов, освещения, композиции
      // - Второе изображение (аватарка клиента) - для прически и лица
      // - Поза тела и рук - генерируются по промпту (разные каждый раз)
      let enhancedPrompt = prompt;
      if (styleReference && detectedGender === "female") {
        // УСИЛЕННЫЙ промпт с явными инструкциями для Nano Banana Pro
        enhancedPrompt = `STYLE REFERENCE: Use the FIRST image (snow-girl.jpg) as the PRIMARY style reference. Apply its visual style, color palette, lighting conditions, composition, background atmosphere, clothing style, and overall aesthetic mood. FACE REFERENCE: Use the SECOND image (user avatar) ONLY for the person's face features and hairstyle - copy the exact face structure, eyes, nose, mouth, and hair from the second image. BODY POSE: Generate a NEW body pose, arm positions, and camera angle as described in the prompt - each photo must have different hand positions and body posture. ${prompt}`;
        log.info(
          "Enhanced prompt for paid user: STRONG style transfer from snow-girl.jpg (1st image), face/hairstyle from user avatar (2nd image), new body poses"
        );
      }

      log.info(
        `Generating paid photo with prompt: "${enhancedPrompt.substring(0, 80)}..."`
      );
      log.info(
        `Using ${imagesForGeneration.length} images: [snow-girl.jpg (style), user avatar (hairstyle & face)]`
      );

      // Генерируем креативное фото через Nano Banana Pro
      // Nano Banana Pro: первое изображение для стиля, второе для лица
      const result = await nanoBanana.generate({
        prompt: enhancedPrompt,
        images: imagesForGeneration,
        aspectRatio: "9:16",
        resolution: "2K",
        outputFormat: "jpg",
        negativePrompt: DEFAULT_NEGATIVE_PROMPT, // Убираем AI-артефакты
        model: "nano-banana", // Nano Banana Pro применяет стиль из первого изображения, лицо из второго
      });

      if (!result.success || !result.imageUrl) {
        log.error(`Failed to generate paid photo: ${result.error}`);
        await telegram.sendMessage(
          chatId,
          `Произошла ошибка при генерации фото. Пожалуйста, попробуйте позже или напишите в поддержку.`
        );
        return;
      }

      log.info(`Generated paid photo: ${result.imageUrl}`);

      // Формируем caption для оплаченного фото с рекламой бота
      const botPromo = getRandomBotPromo();
      const caption = `@${user.username || user.firstName}, ваш персональный AI-портрет готов.

Для создания новых работ — напишите в этот чат.

${botPromo}`;

      // Отправляем фото
      const sendResult = await telegram.sendPhoto(
        chatId,
        result.imageUrl,
        caption
      );

      if (sendResult.success) {
        log.info(
          `Successfully sent paid photo to chat ${chatId} for user ${user.username || userId}`
        );
      } else {
        log.error(`Failed to send paid photo: ${sendResult.error}`);
      }
    } catch (error) {
      log.error("Error generating paid photo", error);
    }
  }
}

export default ProactiveAvatarService;
