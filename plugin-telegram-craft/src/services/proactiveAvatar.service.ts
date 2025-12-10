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
 */

import { Service, IAgentRuntime, logger, ModelType } from '@elizaos/core';
import { TelegramService } from './telegram.service';
import { NanoBananaService } from './nanoBanana.service';
import { PaymentService, PRICES, FREE_PHOTOS_LIMIT } from './payment.service';
import { ITelegramUser } from '../types/telegram.types';
import { AGENTS_CONFIG, getAgentConfig } from '../config/agents.config';
import { AvatarAnalysisService, AvatarAnalysis } from './avatarAnalysis.service';

/**
 * Логгер для ProactiveAvatarService
 */
const log = {
  info: (msg: string) => logger.info(`[ProactiveAvatar] ${msg}`),
  warn: (msg: string) => logger.warn(`[ProactiveAvatar] ${msg}`),
  error: (msg: string, err?: unknown) => logger.error(`[ProactiveAvatar] ${msg}: ${err}`),
  debug: (msg: string) => logger.debug(`[ProactiveAvatar] ${msg}`),
};

/**
 * Промпты для женских портретов (оптимизированы для реалистичности)
 * Ключевые элементы: authentic skin texture, natural pores, catchlights
 * Источники: Reddit, myaiforce.com, bananabatch.com
 */
const FEMALE_PROMPTS = [
  // Естественные портреты с текстурой кожи
  'Professional portrait photograph of a woman, authentic skin texture with natural pores and subtle freckles, expressive eyes with catchlights, soft Rembrandt lighting, shallow depth of field, shot on Canon 85mm f/1.4, DSLR quality, true-to-life colors',

  'Candid portrait of a young woman, natural skin imperfections visible, real skin texture with pores, genuine relaxed expression, soft window light, editorial photography, shot on Sigma 85mm f/1.4, photorealistic quality',

  'Elegant portrait of a woman, detailed skin texture, natural makeup, expressive eyes with natural catchlights, soft diffused lighting, shallow depth of field, Canon 5D Mark IV, lifestyle photography style',

  // Современные с реалистичной кожей
  'Modern editorial portrait of a confident woman, authentic skin with visible pores and subtle imperfections, natural hair texture, soft studio lighting, shallow depth of field, shot on Sony A7R IV 85mm, magazine quality',

  'Professional headshot of a woman, real skin texture, natural expression, Rembrandt lighting pattern, neutral background with soft blur, shot on Canon 85mm f/1.2, corporate photography style, photorealistic',

  'Contemporary lifestyle portrait of a woman, authentic skin details, natural pores visible, genuine smile, golden hour lighting, shallow depth of field, shot on Nikon 85mm f/1.4, true colors',

  // Художественные но реалистичные
  'Fine art portrait of a woman, authentic skin texture with subtle imperfections, expressive eyes, soft natural lighting from large window, shallow depth of field, shot on Hasselblad, editorial style',

  'Atmospheric portrait of a woman, detailed skin with natural pores, genuine emotion, moody Rembrandt lighting, rich shadows, shot on Canon 85mm f/1.4, cinematic color grading, photorealistic',
];

/**
 * Промпты для мужских портретов (оптимизированы для реалистичности)
 * Ключевые элементы: authentic skin texture, stubble detail, catchlights
 * Источники: Reddit, myaiforce.com, bananabatch.com
 */
const MALE_PROMPTS = [
  // Профессиональные с реалистичной кожей
  'Professional portrait photograph of a man, authentic skin texture with natural pores and visible stubble, expressive eyes with catchlights, dramatic Rembrandt lighting, shallow depth of field, shot on Canon 85mm f/1.4, DSLR quality, true-to-life colors',

  'Corporate headshot of a confident man, real skin texture with natural imperfections, genuine expression, soft studio lighting, neutral background, shot on Sony A7R IV 85mm, photorealistic quality',

  'Editorial portrait of a man, detailed skin texture with pores and fine lines, natural stubble visible, expressive eyes, soft window light, shot on Sigma 85mm f/1.4, magazine quality',

  // Современные с текстурой
  'Modern lifestyle portrait of a man, authentic skin with visible pores, natural hair texture, relaxed genuine expression, golden hour lighting, shallow depth of field, shot on Nikon 85mm f/1.4, photorealistic',

  'Contemporary portrait of a stylish man, real skin texture, subtle stubble detail, confident natural expression, soft studio lighting, shot on Canon 5D Mark IV, editorial photography style',

  'Urban portrait of a young man, authentic skin details with natural imperfections, genuine emotion, natural daylight, shallow depth of field, shot on Sony 85mm f/1.4, documentary style',

  // Художественные но реалистичные
  'Fine art portrait of a man, detailed skin texture with visible pores, expressive eyes with catchlights, dramatic chiaroscuro lighting, rich shadows, shot on Hasselblad, cinematic quality',

  'Atmospheric portrait of a man, authentic skin with stubble and natural texture, intense but genuine gaze, moody Rembrandt lighting, shot on Canon 85mm f/1.2, editorial color grading, photorealistic',
];

/**
 * Negative prompt для предотвращения AI-артефактов
 * Убирает "пластиковую кожу", uncanny valley, и другие типичные проблемы
 */
const DEFAULT_NEGATIVE_PROMPT =
  'plastic skin, smooth skin, airbrushed, uncanny valley, doll-like, wax figure, ' +
  '3d render, cartoon, anime, sketches, painting, illustration, digital art, ' +
  'deformed, blurry, bad anatomy, disfigured, poorly drawn face, mutation, ' +
  'mutated, extra limbs, extra fingers, malformed hands, missing fingers, ' +
  'watermark, signature, text, logo, oversaturated, overexposed, ' +
  'low quality, jpeg artifacts, cropped, out of frame';

/**
 * Мужские имена-исключения (оканчиваются на -а/-я, но мужские)
 */
const MALE_NAME_EXCEPTIONS = ['илья', 'никита', 'саша', 'женя', 'валя', 'миша', 'коля', 'петя', 'вася', 'дима', 'лёша', 'серёжа', 'алёша', 'ваня', 'толя', 'лёня', 'гриша', 'стёпа', 'костя', 'витя', 'митя', 'федя', 'боря', 'юра', 'гоша', 'лёва', 'паша', 'тёма', 'кирилла'];

/**
 * Известные женские имена (русские и английские)
 */
const FEMALE_NAMES = [
  // Английские/международные
  'gaia', 'sophia', 'emma', 'olivia', 'ava', 'isabella', 'mia', 'charlotte', 'amelia', 'harper',
  'evelyn', 'abigail', 'emily', 'elizabeth', 'sofia', 'ella', 'madison', 'scarlett', 'victoria',
  'aria', 'grace', 'chloe', 'camila', 'luna', 'zoey', 'nora', 'lily', 'eleanor', 'hannah',
  'lillian', 'addison', 'aubrey', 'ellie', 'stella', 'natalie', 'zoe', 'leah', 'hazel', 'violet',
  'aurora', 'savannah', 'audrey', 'brooklyn', 'bella', 'claire', 'skylar', 'lucy', 'paisley',
  'anna', 'caroline', 'genesis', 'aaliyah', 'kennedy', 'kinsley', 'allison', 'maya', 'sarah',
  'madelyn', 'adeline', 'alexa', 'ariana', 'elena', 'gabriella', 'naomi', 'alice', 'sadie',
  'hailey', 'eva', 'emilia', 'autumn', 'quinn', 'nevaeh', 'piper', 'ruby', 'serenity', 'willow',
  'everly', 'cora', 'kaylee', 'lydia', 'aubree', 'arianna', 'eliana', 'peyton', 'melanie',
  'gianna', 'isabelle', 'julia', 'valentina', 'nova', 'clara', 'vivian', 'reagan', 'mackenzie',
  // Русские (транслит)
  'marina', 'katya', 'katia', 'kate', 'karina', 'daria', 'dasha', 'polina', 'alina', 'arina',
  'kristina', 'christina', 'diana', 'lena', 'elena', 'helen', 'irina', 'ira', 'natasha', 'tanya',
  'tatiana', 'olga', 'oksana', 'yulia', 'julia', 'maria', 'masha', 'anna', 'anya', 'nastya',
  'anastasia', 'sveta', 'svetlana', 'vera', 'vika', 'viktoria', 'alexandra', 'sasha', 'zhenya',
  'evgenia', 'nadia', 'nadya', 'galina', 'galya', 'lyuba', 'lyudmila', 'larisa', 'lera', 'valeria',
];

/**
 * Известные мужские имена (английские)
 */
const MALE_NAMES = [
  'james', 'john', 'robert', 'michael', 'david', 'william', 'richard', 'joseph', 'thomas', 'charles',
  'christopher', 'daniel', 'matthew', 'anthony', 'mark', 'donald', 'steven', 'paul', 'andrew', 'joshua',
  'kenneth', 'kevin', 'brian', 'george', 'timothy', 'ronald', 'edward', 'jason', 'jeffrey', 'ryan',
  'jacob', 'gary', 'nicholas', 'eric', 'jonathan', 'stephen', 'larry', 'justin', 'scott', 'brandon',
  'benjamin', 'samuel', 'raymond', 'gregory', 'frank', 'alexander', 'patrick', 'raymond', 'jack', 'dennis',
  'jerry', 'tyler', 'aaron', 'jose', 'adam', 'nathan', 'henry', 'douglas', 'zachary', 'peter',
  'kyle', 'noah', 'ethan', 'jeremy', 'walter', 'christian', 'keith', 'roger', 'terry', 'austin',
  'sean', 'gerald', 'carl', 'harold', 'dylan', 'arthur', 'lawrence', 'jordan', 'jesse', 'bryan',
  // Русские (транслит)
  'alex', 'alexey', 'andrey', 'andrew', 'anton', 'artem', 'boris', 'denis', 'dmitry', 'dmitri',
  'evgeny', 'eugene', 'igor', 'ivan', 'kirill', 'konstantin', 'leonid', 'maxim', 'max', 'mikhail',
  'nikolay', 'oleg', 'pavel', 'roman', 'sergey', 'sergei', 'stanislav', 'vadim', 'viktor', 'victor',
  'vladimir', 'vlad', 'yuri', 'yury', 'yaroslav',
];

/**
 * Определение пола по имени (русские и английские имена)
 */
function detectGender(firstName: string): 'male' | 'female' {
  if (!firstName) return 'male';

  const name = firstName.toLowerCase().trim();

  // Сначала проверяем списки известных имён
  if (FEMALE_NAMES.includes(name)) {
    return 'female';
  }

  if (MALE_NAMES.includes(name)) {
    return 'male';
  }

  // Проверяем исключения (мужские имена на -а/-я)
  if (MALE_NAME_EXCEPTIONS.includes(name)) {
    return 'male';
  }

  // Русские женские окончания
  const femaleEndingsRu = ['а', 'я', 'ия', 'ья'];
  for (const ending of femaleEndingsRu) {
    if (name.endsWith(ending)) {
      return 'female';
    }
  }

  // Английские женские окончания
  const femaleEndingsEn = ['a', 'ia', 'ya', 'ina', 'ena', 'ella', 'anna', 'etta', 'issa'];
  for (const ending of femaleEndingsEn) {
    if (name.endsWith(ending) && name.length > ending.length + 1) {
      return 'female';
    }
  }

  // По умолчанию мужской
  return 'male';
}

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
 * Получить fallback сообщение
 */
function getFallbackPromoMessage(username: string): string {
  const randomIndex = Math.floor(Math.random() * FALLBACK_PROMO_MESSAGES.length);
  return FALLBACK_PROMO_MESSAGES[randomIndex].replace('{username}', username);
}

/**
 * Интервалы (в минутах)
 */
const DEFAULT_INTERVAL_MINUTES = 60; // 1 час
const MIN_INTERVAL_MINUTES = 30; // Минимум 30 минут между сообщениями

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
  static serviceType = 'proactive-avatar';
  serviceType = 'proactive-avatar';

  /**
   * Static start method required by ElizaOS 1.6+
   */
  static async start(runtime: IAgentRuntime): Promise<Service> {
    log.info('STATIC start() called');
    const instance = new ProactiveAvatarService();
    await instance.initialize(runtime);
    await instance.start();
    return instance;
  }

  /**
   * Static stop method required by ElizaOS 1.6+
   */
  static async stop(runtime: IAgentRuntime): Promise<void> {
    log.info('STATIC stop() called');
    const instance = runtime.getService('proactive-avatar') as ProactiveAvatarService;
    if (instance) {
      await instance.stop();
    }
  }

  capabilityDescription = 'Проактивная реклама через креативные аватарки участников группы';

  /** Runtime агента */
  private runtime: IAgentRuntime | null = null;

  /** Состояние по чатам */
  private stateByChat: Map<string, ProactiveState> = new Map();

  /** Флаг инициализации */
  private isInitialized = false;

  /** Сервис анализа аватарок (YOLO + LLaVA) */
  private avatarAnalysis: AvatarAnalysisService | null = null;

  /**
   * Инициализация сервиса
   */
  async initialize(runtime: IAgentRuntime): Promise<void> {
    if (this.isInitialized) {
      log.warn('Service already initialized');
      return;
    }

    this.runtime = runtime;
    this.isInitialized = true;

    // Инициализируем AvatarAnalysisService если есть ключ Replicate
    const replicateKey = runtime.getSetting('REPLICATE_API_KEY') || process.env.REPLICATE_API_KEY;
    if (replicateKey) {
      this.avatarAnalysis = new AvatarAnalysisService(replicateKey);
      log.info('AvatarAnalysisService initialized (YOLO + LLaVA)');
    } else {
      log.warn('REPLICATE_API_KEY not found, avatar analysis disabled');
    }

    log.info('Service initialized');
  }

  /**
   * Запуск сервиса - запускаем проактивные таймеры для всех целевых чатов
   */
  async start(): Promise<void> {
    if (!this.runtime) {
      log.error('Runtime not set');
      return;
    }

    // Получаем конфигурацию Sales агента
    const salesConfig = getAgentConfig('sales');
    if (!salesConfig) {
      log.warn('Sales agent config not found');
      return;
    }

    // Проверяем, включен ли проактивный режим
    if (!salesConfig.behavior.proactiveEnabled) {
      log.info('Proactive mode disabled for sales agent');
      return;
    }

    const intervalMinutes = salesConfig.behavior.proactiveIntervalMinutes || DEFAULT_INTERVAL_MINUTES;

    // Запускаем таймеры для всех целевых чатов Sales агента
    for (const chat of salesConfig.targetChats) {
      if (chat.isActive) {
        this.startProactiveLoop(chat.chatId, intervalMinutes);
        log.info(`Started proactive loop for chat ${chat.chatName} (${chat.chatId}), interval: ${intervalMinutes} min`);
      }
    }

    log.info('Service started');
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
    log.info('Service stopped');
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
    const intervalMs = Math.max(intervalMinutes, MIN_INTERVAL_MINUTES) * 60 * 1000;

    // Запускаем таймер
    state.timerId = setInterval(async () => {
      await this.executeProactiveAction(chatId);
    }, intervalMs);

    this.stateByChat.set(chatId, state);

    // Также выполняем сразу (с небольшой задержкой для инициализации)
    setTimeout(async () => {
      await this.executeProactiveAction(chatId);
    }, 30000); // 30 секунд задержки после старта

    log.info(`Proactive loop started for chat ${chatId}, interval: ${intervalMinutes} minutes`);
  }

  /**
   * Выполнить проактивное действие (генерация и отправка креативного фото)
   */
  async executeProactiveAction(chatId: string): Promise<void> {
    if (!this.runtime) {
      log.error('Runtime not available');
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
      const telegram = this.runtime.getService<TelegramService>('telegram-craft');
      const nanoBanana = this.runtime.getService<NanoBananaService>('nano-banana');

      if (!telegram) {
        log.error('TelegramService not available');
        return;
      }

      if (!nanoBanana || !nanoBanana.isAvailable()) {
        log.error('NanoBananaService not available');
        return;
      }

      // Получаем ID бота, чтобы исключить его из выборки
      const botUser = await telegram.getMe();
      const botId = botUser?.id?.toString() || '';
      log.info(`Bot ID: ${botId}`);

      // Получаем участников группы
      const members = await telegram.getGroupMembers(chatId, 100);
      if (members.length === 0) {
        log.warn(`No members found in chat ${chatId}`);
        return;
      }

      log.info(`Found ${members.length} members in chat ${chatId}`);

      // Фильтруем: исключаем уже обработанных, тех у кого нет username, и самого бота
      const availableMembers = members.filter(
        (m) => m.username &&
               !state.processedUsers.has(m.id.toString()) &&
               m.id.toString() !== botId // Исключаем бота
      );

      if (availableMembers.length === 0) {
        // Сбрасываем список обработанных, начинаем заново
        log.info('All members processed, resetting list');
        state.processedUsers.clear();
        return;
      }

      // Пробуем найти пользователя с аватаркой И человеком на ней (максимум 10 попыток)
      let selectedUser: ITelegramUser | null = null;
      let avatarDataUrl: string | null = null;
      let detectedGender: 'male' | 'female' | 'unknown' = 'unknown';
      const maxAttempts = Math.min(10, availableMembers.length);

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Выбираем случайного участника
        const randomIndex = Math.floor(Math.random() * availableMembers.length);
        const candidate = availableMembers[randomIndex];

        log.info(`Attempt ${attempt + 1}/${maxAttempts}: Trying user ${candidate.firstName || candidate.username} (${candidate.id})`);

        // Получаем аватарку
        const candidateAvatar = await telegram.getUserAvatar(candidate.id.toString());
        if (!candidateAvatar) {
          log.warn(`User ${candidate.id} has no avatar, trying next...`);
          state.processedUsers.add(candidate.id.toString());
          availableMembers.splice(randomIndex, 1);
          if (availableMembers.length === 0) {
            log.info('No more available members with avatars');
            return;
          }
          continue;
        }

        // НОВОЕ: Анализируем аватарку через YOLO + LLaVA
        if (this.avatarAnalysis) {
          log.info(`Analyzing avatar for user ${candidate.id}...`);
          const analysis = await this.avatarAnalysis.analyze(candidateAvatar);

          if (!analysis.hasHuman) {
            log.info(`User ${candidate.firstName || candidate.id} has no human on avatar, skipping`);
            state.processedUsers.add(candidate.id.toString());
            availableMembers.splice(randomIndex, 1);
            if (availableMembers.length === 0) {
              log.info('No more available members with human avatars');
              return;
            }
            continue;
          }

          // Сохраняем определённый пол из CV анализа
          detectedGender = analysis.gender;
          log.info(`Avatar analysis: hasHuman=true, gender=${analysis.gender} (confidence: ${analysis.confidence}%)`);
        }

        // Пользователь подходит!
        selectedUser = candidate;
        avatarDataUrl = candidateAvatar;
        log.info(`Got valid avatar for user ${candidate.id}`);
        break;
      }

      if (!selectedUser || !avatarDataUrl) {
        log.warn('Could not find any user with valid avatar after multiple attempts');
        return;
      }

      log.info(`Selected user: ${selectedUser.firstName || selectedUser.username} (${selectedUser.id}), detected gender: ${detectedGender}`);

      // ============================================
      // FREEMIUM: Проверка лимита бесплатных фото
      // ============================================
      const paymentService = this.runtime.getService<PaymentService>('payment');
      const userId = selectedUser.id.toString();

      if (paymentService && !paymentService.hasFreePhotosRemaining(userId)) {
        // Лимит бесплатных фото исчерпан - показываем кнопку оплаты
        log.info(`User ${userId} has no free photos remaining, showing payment button`);

        const remaining = paymentService.getFreePhotosRemaining(userId);
        const used = paymentService.getFreePhotosUsed(userId);

        // Создаём ссылку на инвойс (для групп нельзя sendInvoice, только ссылка)
        const invoiceLink = await paymentService.createInvoiceLink(PRICES.PERSONAL_PHOTO, userId);

        const paymentCaption = `@${selectedUser.username || selectedUser.firstName}, ваш лимит бесплатных фото (${FREE_PHOTOS_LIMIT} шт.) исчерпан.

Стоимость персонального AI-портрета: ${PRICES.PERSONAL_PHOTO} ⭐`;

        // Отправляем сообщение с кнопкой оплаты
        if (invoiceLink) {
          await telegram.sendMessage(chatId, paymentCaption, {
            replyMarkup: {
              inlineKeyboard: [[
                { text: `Заказать (${PRICES.PERSONAL_PHOTO} ⭐)`, url: invoiceLink }
              ]]
            }
          });
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
        log.info(`User ${userId} has ${remaining}/${FREE_PHOTOS_LIMIT} free photos remaining`);
      }

      // Получаем сообщения пользователя для персонализации промпта
      const userMessages = await this.getUserMessagesFromChat(
        chatId,
        selectedUser.id.toString(),
        200
      );

      // Генерируем персонализированный промпт на основе сообщений
      const prompt = await this.generatePersonalizedPrompt(selectedUser, userMessages, detectedGender);

      log.info(`Using prompt: "${prompt.substring(0, 80)}..."`);

      // Генерируем креативное фото через Nano Banana Pro
      const result = await nanoBanana.generate({
        prompt,
        images: [avatarDataUrl],
        aspectRatio: '9:16', // Вертикальный формат для Instagram/Stories
        resolution: '2K',
        outputFormat: 'jpg', // JPG меньше по размеру, лучше для Telegram
        negativePrompt: DEFAULT_NEGATIVE_PROMPT, // Убираем AI-артефакты
        model: 'seedream', // Seedream поддерживает negative_prompt
      });

      if (!result.success || !result.imageUrl) {
        log.error(`Failed to generate creative photo: ${result.error}`);
        return;
      }

      log.info(`Generated creative photo: ${result.imageUrl}`);

      // Формируем УНИКАЛЬНЫЙ персональный caption через LLM
      const caption = await this.generatePersonalizedCaption(selectedUser, userMessages, prompt);

      // Отправляем фото как изображение (видимое сразу в чате)
      const sendResult = await telegram.sendPhoto(chatId, result.imageUrl, caption);

      if (sendResult.success) {
        log.info(`Successfully sent creative photo to chat ${chatId} for user ${selectedUser.username}`);

        // FREEMIUM: Увеличиваем счётчик использованных бесплатных фото
        if (paymentService) {
          paymentService.incrementFreePhotos(userId);
          const remaining = paymentService.getFreePhotosRemaining(userId);
          log.info(`User ${userId} used a free photo, ${remaining}/${FREE_PHOTOS_LIMIT} remaining`);
        }

        // Обновляем состояние
        state.processedUsers.add(selectedUser.id.toString());
        state.lastSentTime = new Date();
      } else {
        log.error(`Failed to send photo: ${sendResult.error}`);
      }
    } catch (error) {
      log.error('Error executing proactive action', error);
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
      log.warn('Runtime not available for getUserMessagesFromChat');
      return [];
    }

    try {
      const telegram = this.runtime.getService<TelegramService>('telegram-craft');
      if (!telegram) {
        log.warn('TelegramService not available');
        return [];
      }

      // Получаем последние сообщения из чата
      const messages = await telegram.getMessages(chatId, limit);
      log.info(`Retrieved ${messages.length} messages from chat ${chatId}`);

      // Фильтруем сообщения конкретного пользователя
      const userMessages = messages
        .filter(msg => msg.fromId === userId && msg.text && msg.text.length > 3)
        .map(msg => msg.text)
        .slice(0, 50); // Берём максимум 50 сообщений для анализа

      log.info(`Found ${userMessages.length} messages from user ${userId}`);
      return userMessages;
    } catch (error) {
      log.error('Error getting user messages', error);
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
    overrideGender?: 'male' | 'female' | 'unknown'
  ): Promise<string> {
    // Определяем пол: сначала CV анализ, потом по имени
    const gender = (overrideGender && overrideGender !== 'unknown')
      ? overrideGender
      : detectGender(user.firstName || '');
    log.info(`Using gender: ${gender} (CV: ${overrideGender || 'none'}, name: ${detectGender(user.firstName || '')})`);
    const genderPrompts = gender === 'female' ? FEMALE_PROMPTS : MALE_PROMPTS;
    const genderWord = gender === 'female' ? 'woman' : 'man';
    const genderRu = gender === 'female' ? 'девушка' : 'мужчина';

    // Если нет сообщений или runtime - возвращаем случайный гендерный промпт
    if (!this.runtime || userMessages.length < 3) {
      const promptIndex = Math.floor(Math.random() * genderPrompts.length);
      log.info(`Using ${gender} fallback prompt (${userMessages.length} messages)`);
      return genderPrompts[promptIndex];
    }

    try {
      const userName = user.firstName || user.username || 'пользователь';

      // Формируем LLM промпт для ГЛУБОКОГО анализа интересов
      const llmPrompt = `Проанализируй сообщения пользователя и создай УНИКАЛЬНЫЙ промпт для AI-портрета.

СООБЩЕНИЯ ПОЛЬЗОВАТЕЛЯ "${userName}" (${genderRu}):
${userMessages.slice(0, 25).join('\n')}

ЗАДАЧА:
1. Определи ГЛАВНЫЕ ИНТЕРЕСЫ человека (работа, хобби, увлечения)
2. Найди КЛЮЧЕВЫЕ ТЕМЫ которые он обсуждает
3. Пойми его ХАРАКТЕР и ЭНЕРГЕТИКУ (спокойный/энергичный, серьёзный/весёлый)
4. Создай промпт для портрета который ОТРАЖАЕТ его личность

ПРИМЕРЫ ПЕРСОНАЛИЗАЦИИ:
- Если человек про IT/код → портрет в стиле tech entrepreneur, с ноутбуком, в современном офисе
- Если про путешествия → adventurous portrait, exotic location backdrop, travel vibes
- Если про спорт/фитнес → athletic portrait, dynamic pose, energetic lighting
- Если про искусство/музыку → artistic portrait, creative lighting, bohemian aesthetic
- Если про бизнес/деньги → powerful executive portrait, luxury setting, confident pose
- Если про еду/кулинарию → warm cozy portrait, kitchen/cafe setting, lifestyle vibes
- Если про моду/красоту → high fashion editorial, glamorous lighting, Vogue style
- Если про природу/животных → natural outdoor portrait, soft organic lighting

ОБЯЗАТЕЛЬНО В ПРОМПТЕ:
- Субъект: ${genderWord}
- Стиль: photorealistic, 8K, shot on Canon/Sigma 85mm f/1.4
- Освещение под настроение (dramatic/soft/golden hour/studio)
- Атмосфера отражающая интересы человека
- Детали окружения или аксессуары связанные с хобби

ФОРМАТ ОТВЕТА:
Верни ТОЛЬКО промпт на АНГЛИЙСКОМ языке (без пояснений), например:
"Confident ${genderWord} software developer in modern co-working space, laptop nearby, ambient neon lighting, tech startup vibes, editorial photography, shot on Canon 85mm f/1.4, 8K quality"

ПРОМПТ:`;

      log.info(`Generating personalized ${gender} prompt based on interests for ${userName}...`);

      // Вызываем LLM через runtime (правильный формат ElizaOS 1.6+)
      const result = await this.runtime.useModel(ModelType.TEXT_SMALL, {
        prompt: llmPrompt,
        maxTokens: 200,
        temperature: 0.8, // Выше для креативности
      });

      if (result && typeof result === 'string' && result.length > 30) {
        let prompt = result.trim();
        // Убираем кавычки если LLM их добавил
        prompt = prompt.replace(/^["']|["']$/g, '');
        log.info(`Generated interest-based prompt: "${prompt.substring(0, 80)}..."`);
        return prompt;
      }

      log.warn('LLM returned empty or invalid response, using fallback prompt');
    } catch (error) {
      log.error('Error generating personalized prompt', error);
    }

    // Fallback к гендер-специфичному промпту
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
      return getFallbackPromoMessage(user.username || user.firstName || 'друг');
    }

    const userName = user.firstName || user.username || 'друг';
    const userTag = user.username ? `@${user.username}` : userName;
    const gender = detectGender(user.firstName || '');
    const genderRu = gender === 'female' ? 'девушка' : 'парень';

    try {
      // Анализируем стиль общения пользователя
      const userStyle = userMessages.length > 3
        ? userMessages.slice(0, 10).join(' ').substring(0, 500)
        : '';

      const llmPrompt = `Напиши КОРОТКУЮ подпись к AI-портрету для ${userTag} в Telegram.

СТИЛЬ: взрослый, профессиональный, уважительный. НЕ подростковый сленг.

ФОРМАТ (2 строки):
1. ${userTag} + краткая реакция на "вы"
2. Приглашение в личные сообщения

ХОРОШИЕ ПРИМЕРЫ:
"${userTag}, посмотрите, что получилось.
Если хотите ещё — напишите в личные сообщения."

"${userTag}, вот ваш креативный портрет.
Для новых вариантов пишите в ЛС."

"${userTag}, готово.
За дополнительными работами — в личку."

"${userTag}, ваш AI-портрет.
Хотите попробовать другой стиль? Напишите мне."

"${userTag}, принимайте результат.
Больше вариантов — в личных сообщениях."

ПРАВИЛА:
- Обращение на "вы" (вежливо)
- Без эмодзи
- Спокойный тон, без восклицаний "вау", "круто", "огонь"
- Каждый раз РАЗНОЕ!

ЗАПРЕЩЕНО:
- Подростковый сленг (вау, круто, огонь, топ, кайф)
- Обращение на "ты"
- Эмодзи
- Упоминать ботов
- Гендерные слова

Верни ТОЛЬКО текст подписи:`;

      log.info(`Generating personalized caption for ${userName}...`);

      // Вызываем LLM через runtime (правильный формат ElizaOS 1.6+)
      const result = await this.runtime.useModel(ModelType.TEXT_SMALL, {
        prompt: llmPrompt,
        maxTokens: 150,
        temperature: 0.9, // Высокая температура для разнообразия
      });

      if (result && typeof result === 'string' && result.length > 5) {
        // Просто чистим результат, без добавления рекламы
        const caption = result.trim().replace(/^["']|["']$/g, '');
        log.info(`Generated personalized caption: "${caption}"`);
        return caption;
      }

      log.warn('LLM returned empty caption, using fallback');
    } catch (error) {
      log.error('Error generating personalized caption', error);
    }

    return getFallbackPromoMessage(user.username || user.firstName || 'друг');
  }

  /**
   * Получить статистику по чату
   */
  getStats(chatId: string): { processedCount: number; lastSent: Date | null; isActive: boolean } | null {
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
      log.error('Runtime not available for generateForPaidUser');
      return;
    }

    log.info(`Generating paid photo for user ${userId} in chat ${chatId}`);

    try {
      // Получаем сервисы
      const telegram = this.runtime.getService<TelegramService>('telegram-craft');
      const nanoBanana = this.runtime.getService<NanoBananaService>('nano-banana');

      if (!telegram) {
        log.error('TelegramService not available');
        return;
      }

      if (!nanoBanana || !nanoBanana.isAvailable()) {
        log.error('NanoBananaService not available');
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
        firstName: userEntity.firstName || '',
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
      let detectedGender: 'male' | 'female' | 'unknown' = 'unknown';
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
        log.info(`Paid user avatar analysis: gender=${analysis.gender} (confidence: ${analysis.confidence}%)`);
      }

      // Получаем сообщения пользователя для персонализации
      const userMessages = await this.getUserMessagesFromChat(chatId, userId, 200);

      // Генерируем персонализированный промпт с учётом CV-определённого пола
      const prompt = await this.generatePersonalizedPrompt(user, userMessages, detectedGender);

      log.info(`Generating paid photo with prompt: "${prompt.substring(0, 80)}..."`);

      // Генерируем креативное фото через Nano Banana Pro
      const result = await nanoBanana.generate({
        prompt,
        images: [avatarDataUrl],
        aspectRatio: '9:16',
        resolution: '2K',
        outputFormat: 'jpg',
        negativePrompt: DEFAULT_NEGATIVE_PROMPT, // Убираем AI-артефакты
        model: 'seedream', // Seedream поддерживает negative_prompt
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

      // Формируем caption для оплаченного фото
      const caption = `@${user.username || user.firstName}, ваш персональный AI-портрет готов.

Для создания новых работ — напишите в этот чат.`;

      // Отправляем фото
      const sendResult = await telegram.sendPhoto(chatId, result.imageUrl, caption);

      if (sendResult.success) {
        log.info(`Successfully sent paid photo to chat ${chatId} for user ${user.username || userId}`);
      } else {
        log.error(`Failed to send paid photo: ${sendResult.error}`);
      }
    } catch (error) {
      log.error('Error generating paid photo', error);
    }
  }
}

export default ProactiveAvatarService;
