/**
 * Централизованная конфигурация всех агентов
 *
 * Здесь настраивается:
 * - Целевые чаты (кому отвечать)
 * - Триггеры (на что реагировать)
 * - Стиль общения
 * - Источники знаний (RAG)
 * - Настройки продаж
 * - Поведение (rate limiting, вероятности)
 */

// ============================================
// ИНТЕРФЕЙСЫ
// ============================================

/**
 * Полная конфигурация агента
 */
export interface AgentConfig {
  /** Уникальный ID агента */
  id: string;
  /** Отображаемое имя */
  name: string;
  /** Telegram username (без @) */
  username: string;

  /** Целевые чаты */
  targetChats: ChatTarget[];

  /** Настройки триггеров */
  triggers: TriggerConfig;

  /** Настройки стиля */
  style: StyleConfig;

  /** Настройки знаний (RAG) */
  knowledge: KnowledgeConfig;

  /** Настройки продаж (опционально) */
  sales?: AgentSalesConfig;

  /** Настройки видео промптинга (опционально) */
  videoPrompting?: VideoPromptConfig;

  /** Настройки фото промптинга (опционально) */
  photoPrompting?: PhotoPromptConfig;

  /** Настройки музыкального промптинга (опционально) */
  musicPrompting?: MusicPromptConfig;

  /** Настройки поведения */
  behavior: BehaviorConfig;
}

/**
 * Целевой чат
 */
export interface ChatTarget {
  /** ID чата в Telegram (строка) */
  chatId: string;
  /** Название чата для отображения */
  chatName: string;
  /** Тип чата */
  type: "group" | "supergroup" | "channel" | "private";
  /** Активен ли чат */
  isActive: boolean;
  /** Кастомные триггеры только для этого чата */
  customTriggers?: string[];
  /** Вероятность ответа (0.0 - 1.0), переопределяет базовую */
  responseProbability?: number;
  /** Может ли бот писать в этот чат (по умолчанию true) */
  canWrite?: boolean;
  /** ID чата для пересылки диалогов (лиды) */
  forwardChatId?: string;
  /** Категории триггеров, при которых пересылать диалог */
  forwardTriggerCategories?: string[];
  /** Разрешена ли генерация изображений (по умолчанию true) */
  allowImages?: boolean;
}

/**
 * Конфигурация триггеров
 */
export interface TriggerConfig {
  /** Слова-триггеры */
  words: string[];
  /** Категории триггеров */
  categories: string[];
  /** Требуется ли упоминание бота */
  requireMention: boolean;
  /** Базовая вероятность ответа (0.0 - 1.0) */
  responseProbability: number;
}

/**
 * Конфигурация стиля
 */
export interface StyleConfig {
  /** Язык ответов */
  language: "ru" | "en" | "mixed";
  /** Уровень формальности */
  formality: "casual" | "professional" | "bro";
  /** Разрешены ли эмодзи */
  emojisAllowed: boolean;
  /** Максимальная длина ответа */
  maxResponseLength: number;
  /** Прилагательные для описания стиля */
  adjectives: string[];
  /** Разрешённый сленг */
  slangs: string[];
  /** Примеры ответов (few-shot) */
  responseExamples: ResponseExample[];
}

/**
 * Пример ответа для few-shot learning
 */
export interface ResponseExample {
  /** Контекст (опционально) */
  context?: string;
  /** Сообщение пользователя */
  userMessage: string;
  /** Ответ бота */
  botResponse: string;
}

/**
 * Конфигурация знаний (RAG)
 */
export interface KnowledgeConfig {
  /** Источники знаний */
  sources: KnowledgeSourceConfig[];
  /** Модель для embeddings */
  embeddingModel: string;
  /** Лимит результатов поиска */
  searchLimit: number;
  /** Минимальная схожесть для включения в контекст */
  minSimilarity: number;
}

/**
 * Источник знаний
 */
export interface KnowledgeSourceConfig {
  /** Тип источника */
  type: "md_file" | "md_directory" | "json" | "web";
  /** Путь к источнику */
  path: string;
  /** Название источника */
  name: string;
  /** Описание (опционально) */
  description?: string;
}

/**
 * Social Proof пример
 */
export interface SocialProofExample {
  /** Username пользователя */
  user: string;
  /** Текст отзыва */
  text: string;
  /** Стиль (опционально) */
  style?: string;
}

/**
 * Upsell сценарий
 */
export interface UpsellScenario {
  /** Триггер (repeat_customer, liked_result, hesitating) */
  trigger: string;
  /** Ответ */
  response: string;
  /** Скидка в процентах (опционально) */
  discount?: number;
}

// ============================================
// VIDEO PROMPTING ИНТЕРФЕЙСЫ
// ============================================

/**
 * Слой видео промпта
 */
export interface VideoPromptLayer {
  /** Название слоя */
  name: string;
  /** Описание на русском */
  description: string;
  /** Ключевые слова для этого слоя */
  keywords: string[];
  /** Примеры использования */
  examples: string[];
}

/**
 * Шаблон камеры
 */
export interface CameraTemplate {
  /** Название шаблона */
  name: string;
  /** Описание на русском */
  description: string;
  /** Промпт для камеры */
  prompt: string;
}

/**
 * Шаблон освещения
 */
export interface LightingTemplate {
  /** Название шаблона */
  name: string;
  /** Описание на русском */
  description: string;
  /** Промпт для освещения */
  prompt: string;
}

/**
 * Пример видео промпта
 */
export interface VideoPromptExample {
  /** Модель (sora2, veo3, kling, runway) */
  model: string;
  /** Описание сцены */
  description: string;
  /** Полный промпт */
  prompt: string;
  /** Длительность */
  duration: string;
}

/**
 * Конфигурация Video Prompting
 */
export interface VideoPromptConfig {
  /** Поддерживаемые модели */
  supportedModels: ("sora2" | "veo3" | "kling" | "runway")[];
  /** Слои промпта */
  promptLayers: VideoPromptLayer[];
  /** Шаблоны камеры */
  cameraTemplates: CameraTemplate[];
  /** Шаблоны освещения */
  lightingTemplates: LightingTemplate[];
  /** Примеры промптов */
  examplePrompts: VideoPromptExample[];
}

// ============================================
// PHOTO PROMPTING ИНТЕРФЕЙСЫ
// ============================================

/**
 * Слой фото промпта
 */
export interface PhotoPromptLayer {
  /** Название слоя */
  name: string;
  /** Описание на русском */
  description: string;
  /** Ключевые слова для этого слоя */
  keywords: string[];
  /** Примеры использования */
  examples: string[];
}

/**
 * Шаблон стиля для фото
 */
export interface PhotoStyleTemplate {
  /** Название стиля */
  name: string;
  /** Описание на русском */
  description: string;
  /** Промпт для стиля */
  prompt: string;
  /** Подходящие модели */
  bestFor: string[];
}

/**
 * Параметр модели (--ar, --stylize и т.д.)
 */
export interface ModelParameter {
  /** Название параметра */
  name: string;
  /** Синтаксис (например --ar) */
  syntax: string;
  /** Описание */
  description: string;
  /** Примеры значений */
  examples: string[];
  /** Для каких моделей */
  models: string[];
}

/**
 * Пример фото промпта
 */
export interface PhotoPromptExample {
  /** Модель (midjourney, dalle3, flux, stable-diffusion) */
  model: string;
  /** Описание */
  description: string;
  /** Полный промпт */
  prompt: string;
  /** Параметры (для MJ) */
  parameters?: string;
}

/**
 * Конфигурация Photo Prompting
 */
export interface PhotoPromptConfig {
  /** Поддерживаемые модели */
  supportedModels: (
    | "midjourney"
    | "dalle3"
    | "flux"
    | "stable-diffusion"
    | "ideogram"
  )[];
  /** Слои промпта */
  promptLayers: PhotoPromptLayer[];
  /** Шаблоны стилей */
  styleTemplates: PhotoStyleTemplate[];
  /** Параметры моделей */
  modelParameters: ModelParameter[];
  /** Примеры промптов */
  examplePrompts: PhotoPromptExample[];
}

// ============================================
// MUSIC PROMPTING ИНТЕРФЕЙСЫ
// ============================================

/**
 * Слой музыкального промпта
 */
export interface MusicPromptLayer {
  /** Название слоя */
  name: string;
  /** Описание */
  description: string;
  /** Ключевые слова */
  keywords: string[];
  /** Примеры использования */
  examples: string[];
}

/**
 * Шаблон жанра
 */
export interface MusicGenreTemplate {
  /** Название жанра */
  name: string;
  /** Описание */
  description: string;
  /** Ключевые слова для промпта */
  promptKeywords: string[];
  /** Типичные инструменты */
  instruments: string[];
  /** Типичный BPM диапазон */
  bpmRange: string;
  /** Рекомендуемые модели */
  bestModels: string[];
}

/**
 * Мета-тег для структуры песни
 */
export interface MusicMetaTag {
  /** Название тега */
  tag: string;
  /** Описание */
  description: string;
  /** Синтаксис */
  syntax: string;
  /** Примеры */
  examples: string[];
  /** Поддерживаемые модели */
  models: string[];
}

/**
 * Пример музыкального промпта
 */
export interface MusicPromptExample {
  /** Модель (suno, udio) */
  model: string;
  /** Описание примера */
  description: string;
  /** Текст промпта */
  prompt: string;
  /** Метатеги (опционально) */
  metaTags?: string;
  /** Жанр */
  genre: string;
}

/**
 * Конфигурация Music Prompting
 */
export interface MusicPromptConfig {
  /** Поддерживаемые модели */
  supportedModels: ("suno" | "udio" | "boomy" | "aiva")[];
  /** Слои промпта */
  promptLayers: MusicPromptLayer[];
  /** Шаблоны жанров */
  genreTemplates: MusicGenreTemplate[];
  /** Мета-теги для структуры */
  metaTags: MusicMetaTag[];
  /** Примеры промптов */
  examplePrompts: MusicPromptExample[];
}

/**
 * Конфигурация продаж
 */
export interface AgentSalesConfig {
  /** Название продукта */
  productName: string;
  /** Цена */
  price: string;
  /** Шаблон CTA */
  ctaTemplate: string;
  /** Обработчики возражений */
  objectionHandlers: Record<string, string>;
  /** Контакт для связи */
  mentorContact: string;
  /** Триггеры срочности */
  urgencyTriggers: string[];
  /** Преимущества продукта */
  features: string[];

  // === НОВЫЕ ПОЛЯ (Best Practices 2025) ===

  /** FOMO сообщения для создания срочности */
  fomoMessages?: string[];
  /** Social proof примеры */
  socialProofExamples?: SocialProofExample[];
  /** Upsell сценарии */
  upsellScenarios?: UpsellScenario[];
  /** Лимиты для freemium модели */
  freemiumLimits?: {
    freeGenerationsPerDay: number;
    freeResolution: "SD" | "HD" | "2K";
    showWatermark: boolean;
  };
}

/**
 * Конфигурация поведения
 */
export interface BehaviorConfig {
  /** Минимальный интервал между ответами (мс) */
  minIntervalMs: number;
  /** Максимум сообщений в час */
  maxMessagesPerHour: number;
  /** Включены ли проактивные сообщения */
  proactiveEnabled: boolean;
  /** Интервал проактивных сообщений (минуты) */
  proactiveIntervalMinutes: number;
}

// ============================================
// КОНФИГУРАЦИЯ АГЕНТОВ
// ============================================

export const AGENTS_CONFIG: Record<string, AgentConfig> = {
  /**
   * VIBEE - главный агент-ментор по вайбкодингу
   */
  vibee: {
    id: "vibee-main",
    name: "VIBEE",
    username: "neuro_sage",

    targetChats: [
      {
        chatId: "2643951085",
        chatName: "Основной чат обучения",
        type: "supergroup",
        isActive: true,
        responseProbability: 0.9,
        forwardChatId: "2737186844", // Forward to Lead group
      },
      {
        chatId: "2298297094",
        chatName: "Дополнительный чат",
        type: "supergroup",
        isActive: true,
        responseProbability: 0.8,
      },
      {
        chatId: "144022504",
        chatName: "Тестовый личный чат (Дмитрий)",
        type: "private",
        isActive: true,
        responseProbability: 1.0,
      },
      {
        chatId: "5082217642",
        chatName: "Крипто Группа (ONLY BUY)",
        type: "supergroup",
        isActive: true,
        canWrite: true, // Explicitly allow writing
        responseProbability: 0.0, // Only respond to trigger
        customTriggers: [
          "куплю крипту",
          "купить крипту",
          "куплю крипты",
          "купить крипты",
          "где купить",
          "где куплю",
          "подскажите где купить",
          "как купить",
          "обменять крипту",
          "обмен крипты",
          "обменять на",
          "usdt",
          "баты",
          "обменник",
          "обмен",
          "п2п",
          "p2p",
          "купить usdt",
          "куплю usdt",
          "где взять",
          "где достать",
          "хочу купить",
          "хочу куплю",
          "я бы купил",
          "я бы крипты купил",
          "пацаны где",
          "ребята где",
          "где можно купить",
          "где можно обменять",
          "криптовалюту",
          "биткоин",
          "эфир",
          "токены",
          "монеты",
          "валюту",
          "крипту купить",
          "крипты купить",
          "куплю биткоин",
          "купить биткоин",
          "обменять биткоин",
          "биткоин на",
          "на биткоин",
          "крипта на",
          "на крипту",
          "крипты на",
          "на крипты",
        ],
        forwardChatId: "2737186844", // Forward to Lead group
        allowImages: false, // Disable image generation
      },
    ],

    triggers: {
      words: [
        "vibee",
        "вайби",
        "вайбкодинг",
        "vibecoding",
        "elizaos",
        "ai агент",
        "клод код",
        "claude code",
        // Триггеры для генерации изображений
        "/generate",
        "/gen",
        "/image",
        "/img",
        "/leadmagnet",
        "/визитка",
        "/edit",
        "сгенерируй",
        "нарисуй",
        "создай картинку",
        "сделай визитку",
        "лидмагнит",
      ],
      categories: [
        "VIBECODING",
        "PROGRAMMING",
        "AI_SPECIAL",
        "IMAGE_GENERATION",
      ],
      requireMention: false,
      responseProbability: 0.8,
    },

    style: {
      language: "ru",
      formality: "casual",
      emojisAllowed: false,
      maxResponseLength: 1500,
      adjectives: ["дружелюбный", "технический", "полезный", "понятный"],
      slangs: [],
      responseExamples: [
        {
          userMessage: "Как создать AI агента?",
          botResponse:
            "Для создания AI агента на ElizaOS нужно: 1) Создать character.json с описанием персонажа, 2) Подключить нужные плагины, 3) Запустить через bun dev. Давай покажу подробнее!",
        },
        {
          userMessage: "Что такое вайбкодинг?",
          botResponse:
            "Вайбкодинг - это когда ты не пишешь код руками, а объясняешь AI что нужно сделать, и он генерирует код за тебя. Ты задаёшь направление, AI реализует. Очень эффективный подход!",
        },
      ],
    },

    knowledge: {
      sources: [
        {
          type: "md_directory",
          path: "knowledge-base/Agentic Vibecoding",
          name: "VibeCoding Guide",
          description: "Полный гайд по вайбкодингу и Claude Code",
        },
        {
          type: "md_directory",
          path: "docs/",
          name: "Project Docs",
          description: "Документация проекта VIBEE",
        },
        {
          type: "md_directory",
          path: "knowledge-base/vibecoder-bible",
          name: "VibeCoder Bible",
          description: "Библия вайбкодера (от KOLS)",
        },
      ],
      embeddingModel: "nomic-embed-text",
      searchLimit: 5,
      minSimilarity: 0.7,
    },

    behavior: {
      minIntervalMs: 5000,
      maxMessagesPerHour: 60,
      proactiveEnabled: false,
      proactiveIntervalMinutes: 60,
    },
  },

  /**
   * KOLS - агент-ментор в стиле бро
   */
  kols: {
    id: "kols-mentor",
    name: "KOLS",
    username: "kols_mentor",

            targetChats: [
              {
                chatId: "2643951085",
                chatName: "Основной чат",
                type: "supergroup",
                isActive: true, // Enabling KOLS for this chat
                customTriggers: ["вайбкодер", "дмитрий", "кольс"],
                canWrite: true,
              },
              {
                chatId: "2298297094",
                chatName: "Дополнительный чат",
                type: "supergroup",
                isActive: true,
                customTriggers: ["вайбкодинг", "промпт", "claude code",],
                canWrite: true,
              },
            ],
    triggers: {
      words: ["вайбкодинг", "промпт", "claude code", "kols", "кольс"],
      categories: ["VIBECODING"],
      requireMention: true,
      responseProbability: 0.9,
    },

    style: {
      language: "ru",
      formality: "bro",
      emojisAllowed: false,
      maxResponseLength: 1000,
      adjectives: ["дружелюбный", "прямой", "опытный", "практичный"],
      slangs: ["бро", "короче", "жёстко", "погнали", "красава"],
      responseExamples: [
        {
          userMessage: "Как писать хорошие промпты?",
          botResponse:
            'Короче, бро, главное - быть конкретным. Не пиши "сделай красиво", пиши "добавь тени 4px blur серого цвета". AI не телепат, ему нужны детали.',
        },
      ],
    },

    knowledge: {
      sources: [
        {
          type: "md_directory",
          path: "knowledge-base/vibecoder-bible",
          name: "VibeCoder Bible",
          description: "Библия вайбкодера от KOLS",
        },
      ],
      embeddingModel: "nomic-embed-text",
      searchLimit: 3,
      minSimilarity: 0.75,
    },

    behavior: {
      minIntervalMs: 10000,
      maxMessagesPerHour: 30,
      proactiveEnabled: true,
      proactiveIntervalMinutes: 90,
    },
  },

  /**
   * Sales Agent - NeuroPhoto Artist для проактивной рекламы через креативные аватарки
   */
  sales: {
    id: "neuro-photo-artist",
    name: "NeuroPhoto Artist",
    username: "neuro_blogger_bot",

    targetChats: [
      {
        chatId: "2737186844",
        chatName: "Группа продвижения нейросетей",
        type: "supergroup",
        isActive: false,
        responseProbability: 1.0,
        // Уточнённые триггеры - меньше false positives
        customTriggers: [
          // Интерес к результату (контекстные)
          "как ты это сделал",
          "как это работает",
          "какая нейросеть",
          "что за бот",

          // Желание заказать
          "мне можешь",
          "мне тоже",
          "хочу такое",
          "хочу себе",
          "сделай мне",
          "можешь сделать",

          // Вопросы о цене/процессе
          "сколько стоит",
          "как заказать",
          "какие стили",
          "какое качество",
          "как долго",

          // Комплименты + контекст (не просто "круто")
          "круто получилось",
          "классная аватарка",
          "красивое фото",
          "офигенно вышло",
          "шикарно получилось",
        ],
      },
      // === ЦЕЛЕВЫЕ ГРУППЫ ДЛЯ ПРОДВИЖЕНИЯ ===
      {
        chatId: "-1001729610573",
        chatName: "Нейро Завтрак на Пангане",
        type: "supergroup",
        isActive: true,
        responseProbability: 1.0,
        customTriggers: [
          "как ты это сделал",
          "как это работает",
          "какая нейросеть",
          "что за бот",
          "мне можешь",
          "мне тоже",
          "хочу такое",
          "хочу себе",
          "сделай мне",
          "сколько стоит",
          "как заказать",
          "круто получилось",
          "красивое фото",
        ],
      },
      {
        chatId: "-4832231272",
        chatName: "Сдача контент - завода cocoage",
        type: "group",
        isActive: true, // ✅ Включена рассылка фото
        responseProbability: 1.0,
        customTriggers: [
          "как ты это сделал",
          "как это работает",
          "какая нейросеть",
          "что за бот",
          "мне можешь",
          "мне тоже",
          "хочу такое",
          "хочу себе",
          "сделай мне",
          "сколько стоит",
          "как заказать",
          "круто получилось",
          "красивое фото",
        ],
      },
      // "Тай Инфо Чат" (-1001144640997) удалён - это НЕ целевой чат для бота
    ],

    triggers: {
      words: [
        // Прямые запросы
        "круто получилось",
        "мне можешь",
        "хочу такое",
        "сколько стоит",
        "как это работает",
        "какие стили",
        "сделай мне",
        "@neuro_blogger_bot",

        // Дополнительные точные триггеры
        "сделай аватарку",
        "хочу аватарку",
        "нарисуй портрет",
        "сгенерируй фото",
        "нейрофото",
        "ai фото",
        "ai аватар",
      ],
      categories: ["CREATIVE_PHOTO", "AI_ART"],
      requireMention: false,
      responseProbability: 1.0,
    },

    style: {
      language: "ru",
      formality: "casual",
      emojisAllowed: false,
      maxResponseLength: 500,
      adjectives: [
        "творческий",
        "восторженный",
        "дружелюбный",
        "художественный",
        "яркий",
      ],
      slangs: [],
      responseExamples: [
        // === Базовые сценарии ===
        {
          context: "Пользователь восхищается результатом",
          userMessage: "Вау, круто получилось!",
          botResponse:
            "Спасибо! Это только один стиль из 8. Напиши @neuro_blogger_bot - покажу все варианты. Кстати, за сегодня уже 47 человек сделали себе аватарки!",
        },
        {
          context: "Пользователь хочет себе такое же",
          userMessage: "А мне можешь сделать?",
          botResponse:
            "Конечно! Пиши в личку @neuro_blogger_bot - скинь фото и выбери стиль. Через 30 секунд готово! Первая генерация бесплатная.",
        },
        {
          context: "Пользователь спрашивает о цене",
          userMessage: "Сколько стоит?",
          botResponse:
            "От 2 Stars (~3р) за картинку! Дизайнер берёт 500р, тут в 150 раз дешевле. Пакет 5 фото - ещё выгоднее. Пиши @neuro_blogger_bot!",
        },
        {
          context: "Пользователь интересуется стилями",
          userMessage: "А какие стили есть?",
          botResponse:
            "8 крутых стилей:\n- Киберпанк (неон, Blade Runner вайб)\n- Акварель (мягкие краски)\n- Фэнтези (магия)\n- Поп-арт (яркие цвета)\n- Сюрреализм (сны)\n- Кинематограф (как в кино)\n- Ретро 80-х\n- Голография (футуризм)\n\nХит недели - Киберпанк! Какой ближе тебе?",
        },
        {
          context: "Пользователь сомневается",
          userMessage: "Не, мне не надо",
          botResponse:
            "Понял! Попробуй тогда бесплатную функцию 'Мозг аватара' - обучи AI на своих текстах. А креативные фото - когда будешь готов!",
        },

        // === НОВЫЕ сценарии (Best Practices 2025) ===
        {
          context: "Пользователь уже делал заказ",
          userMessage: "Хочу ещё одну в другом стиле",
          botResponse:
            "Отлично, постоянным клиентам -20% на пакет из 5 фото! Какой стиль на этот раз? Рекомендую Сюрреализм - сейчас в тренде.",
        },
        {
          context: "Пользователь сомневается в качестве",
          userMessage: "А нормально получится? Не как дешёвый фотошоп?",
          botResponse:
            "2K разрешение, реалистичная кожа, никаких AI-артефактов. Смотри свежие примеры в канале! Или давай тебе бесплатный тест?",
        },
        {
          context: "Пользователь спрашивает отличия стилей",
          userMessage: "Чем отличается киберпанк от голографии?",
          botResponse:
            "Киберпанк - неоновые цвета, городской фон, Blade Runner вайб. Голография - переливающийся эффект, футуристично, как на новых купюрах. Что ближе тебе?",
        },
        {
          context: "Пользователь беспокоится о безопасности",
          userMessage: "А мои фото никуда не утекут?",
          botResponse:
            "Фото не сохраняются - удаляются сразу после генерации. Полная конфиденциальность, никакой базы данных с лицами.",
        },
        {
          context: "Пользователь спрашивает о скорости",
          userMessage: "Долго ждать?",
          botResponse:
            "30 секунд максимум! Пока кофе наливаешь - уже готово. А платные заказы обрабатываются в приоритете.",
        },
        {
          context: "Пользователь хочет для бизнеса",
          userMessage: "Это для личного пользования или можно для бизнеса?",
          botResponse:
            "Полные права на использование! Для соцсетей, сайтов, визиток - без ограничений. Некоторые дизайнеры уже используют для клиентов.",
        },
      ],
    },

    knowledge: {
      sources: [
        {
          type: "json",
          path: "docs/sales/pricing.json",
          name: "Pricing",
          description: "Прайс-лист на генерацию фото",
        },
      ],
      embeddingModel: "nomic-embed-text",
      searchLimit: 3,
      minSimilarity: 0.6,
    },

    sales: {
      productName: "NeuroPhoto",
      price: "от 2 Stars (~3р)",
      ctaTemplate:
        "Напиши @neuro_blogger_bot в личку - сделаю тебе креативное фото за 30 секунд!",
      objectionHandlers: {
        // Улучшенные с best practices 2025
        дорого:
          "Дизайнер берёт 500р за аватар, тут 3р - и готово через 30 сек! Попробуй одну бесплатно и сравни.",
        сложно:
          "Всего 3 клика: скинь фото - выбери стиль - получи результат. Даже бабушка справится!",
        "не надо":
          "Понял! А знаешь что бот умеет ещё? Попробуй 'Мозг аватара' - обучи AI на своих текстах бесплатно.",
        потом:
          "Окей! Сохраню скидку 15% до завтра. Напиши /скидка когда будешь готов.",
        качество:
          "Смотри свежие примеры в канале. 2K разрешение, реалистичная кожа, никаких AI-артефактов!",
        безопасно:
          "Фото не сохраняются - удаляются сразу после генерации. Полная конфиденциальность.",
        долго:
          "Генерация занимает 30 секунд максимум. Пока кофе наливаешь - уже готово!",
      },
      mentorContact: "@neuro_blogger_bot",
      urgencyTriggers: [
        "хочу сейчас",
        "сделай мне",
        "быстро",
        "срочно",
        "прям сейчас",
        "можно сейчас",
      ],
      features: [
        "8 художественных стилей",
        "Генерация за 30 секунд",
        "Киберпанк, акварель, поп-арт, фэнтези",
        "От 2 Stars за картинку",
        "Работает прямо в Telegram",
        "2K разрешение без артефактов",
        "Полная конфиденциальность",
      ],

      // === НОВЫЕ ПОЛЯ (Best Practices 2025) ===

      fomoMessages: [
        "За сегодня уже 89 человек сделали креативные аватарки!",
        "Последний час - 12 новых заказов. Присоединяйся!",
        "Стиль 'Киберпанк' - хит недели. 47 довольных клиентов!",
        "Только что сделали шикарный результат в стиле Акварель",
        "Сегодня популярен Поп-арт - уже 23 заказа!",
      ],

      socialProofExamples: [
        {
          user: "@creative_anna",
          text: "Не ожидала такого качества за 3 рубля!",
          style: "Акварель",
        },
        {
          user: "@business_max",
          text: "Теперь это моя аватарка везде. Профессионально!",
          style: "Кинематограф",
        },
        {
          user: "@blogger_kate",
          text: "Подписчики в шоке - думают профи делал",
          style: "Поп-арт",
        },
        {
          user: "@designer_leo",
          text: "Использую для клиентских проектов. Экономия времени огромная",
          style: "Киберпанк",
        },
        {
          user: "@photo_maria",
          text: "Лучше чем Midjourney для портретов!",
          style: "Фэнтези",
        },
      ],

      upsellScenarios: [
        {
          trigger: "repeat_customer",
          response:
            "О, снова ты! Для постоянных клиентов -20% на пакет из 5 фото. Интересует?",
          discount: 20,
        },
        {
          trigger: "liked_result",
          response:
            "Рад что понравилось! Хочешь серию из 5 стилей со скидкой? Будет бомбический коллаж!",
        },
        {
          trigger: "hesitating",
          response:
            "Вижу сомнения. Давай так: первая генерация бесплатно. Если не понравится - ничего не платишь!",
        },
        {
          trigger: "completed_first",
          response:
            "Первое фото готово! Попробуй другой стиль? Второе со скидкой 30%",
          discount: 30,
        },
      ],

      freemiumLimits: {
        freeGenerationsPerDay: 1,
        freeResolution: "SD",
        showWatermark: true,
      },
    },

    behavior: {
      minIntervalMs: 3000,
      maxMessagesPerHour: 20,
      proactiveEnabled: false, // ❌ ВРЕМЕННО ОТКЛЮЧЕНО - пока нет кредитов Replicate
      proactiveIntervalMinutes: 15, // 15 минут между проактивными действиями
    },
  },

  /**
   * Video Expert - эксперт по созданию промптов для AI-видео (Sora 2, Veo 3, Kling)
   * Основан на официальных гайдах OpenAI и Google DeepMind 2025
   */
  videoExpert: {
    id: "video-prompt-expert",
    name: "Video Prompt Expert",
    username: "neuro_video_bot",

    targetChats: [
      {
        chatId: "2643951085",
        chatName: "Основной чат обучения",
        type: "supergroup",
        isActive: true,
        responseProbability: 1.0,
        customTriggers: [
          "напиши промпт для видео",
          "как написать промпт sora",
          "помоги с veo",
          "видео промпт",
        ],
      },
      {
        chatId: "144022504",
        chatName: "Тестовый личный чат",
        type: "private",
        isActive: true,
        responseProbability: 1.0,
      },
    ],

    triggers: {
      words: [
        // Модели
        "sora",
        "сора",
        "veo",
        "вео",
        "veo3",
        "veo 3",
        "sora2",
        "sora 2",
        "kling",
        "runway",

        // Запросы
        "видео промпт",
        "video prompt",
        "промпт для видео",
        "сгенерируй видео",
        "создай видео",
        "как написать промпт",
        "напиши промпт для видео",

        // Техника
        "движение камеры",
        "camera movement",
        "dolly shot",
        "tracking shot",
        "crane shot",
      ],
      categories: ["VIDEO_GENERATION", "AI_VIDEO", "PROMPT_ENGINEERING"],
      requireMention: false,
      responseProbability: 1.0,
    },

    style: {
      language: "ru",
      formality: "professional",
      emojisAllowed: false,
      maxResponseLength: 2000,
      adjectives: [
        "технический",
        "детальный",
        "кинематографичный",
        "профессиональный",
      ],
      slangs: [],
      responseExamples: [
        {
          context: "Пользователь хочет промпт для Sora",
          userMessage: "Напиши промпт для Sora - девушка идёт по улице",
          botResponse:
            'Вот структурированный промпт для Sora 2:\n\n**Cinematography:** Tracking shot from camera right, following at walking pace\n\n**Subject:** A young woman in her 20s, wearing a light summer dress and canvas bag\n\n**Action:** Walks confidently down the street, pauses to look at a shop window, continues\n\n**Context:** Cobblestone European street, afternoon, cafes with outdoor seating\n\n**Lighting:** Soft overcast light, no harsh shadows, warm color palette\n\n**Duration:** 6 seconds\n\nФинальный промпт:\n"Tracking shot from camera right. A young woman in her 20s wearing a light summer dress walks down a cobblestone European street. She pauses at a shop window, glances inside, then continues walking. Soft overcast afternoon light, warm tones. Cafes with outdoor seating in background. 6 seconds."',
        },
        {
          context: "Пользователь спрашивает разницу Sora vs Veo",
          userMessage: "Чем отличаются промпты для Sora и Veo?",
          botResponse:
            'Основные отличия:\n\n**Sora 2:**\n- Сильнее в физике и реалистичном движении\n- Диалог в отдельном блоке: Dialogue: [Speaker]: "[line]"\n- Максимум 12 секунд\n- Якорные цвета 3-5 для консистентности\n\n**Veo 3:**\n- Встроенная генерация звука!\n- Диалог через двоеточие: He says: Hello\n- Добавляй "(no subtitles)" чтобы убрать субтитры\n- Timestamp prompting для сложных сцен\n\nОбщее: структура [Camera]+[Subject]+[Action]+[Context]+[Light] работает для обоих.',
        },
        {
          context: "Пользователь хочет промпт с диалогом для Veo 3",
          userMessage: "Напиши промпт для Veo 3 со звуком и диалогом",
          botResponse:
            'Вот промпт для Veo 3 с аудио:\n\n"Medium shot, tracking right. A barista in a vintage apron prepares espresso in a cozy cafe. Steam rises from the machine. Soft window light, film grain.\n\nHe says: Your usual? (no subtitles)\n\nAmbient: coffee machine hissing, soft jazz in background, distant chatter."\n\n**Важно для Veo 3:**\n- Диалог через двоеточие, не кавычки\n- (no subtitles) убирает авто-субтитры\n- Ambient звуки описывай отдельным блоком\n- 6-12 слов диалога на 8-секундный клип',
        },
        {
          context: "Пользователь спрашивает о движениях камеры",
          userMessage: "Какие движения камеры лучше использовать?",
          botResponse:
            "Основные движения камеры для AI-видео:\n\n**Dolly shots:**\n- Dolly push - приближение к объекту\n- Dolly pull - отдаление\n- Dolly left/right - боковое движение\n\n**Tracking shots:**\n- Following - следование за объектом\n- Leading - камера впереди объекта\n\n**Crane shots:**\n- Rising - подъём вверх\n- Descending - спуск вниз\n\n**Статичные:**\n- Static wide shot - общий план\n- Locked-off - неподвижная камера\n\n**POV:**\n- First-person - от первого лица\n- Over-the-shoulder - через плечо\n\nПравило: один кадр = одно движение камеры + одно действие!",
        },
        {
          context: "Пользователь хочет кинематографичный промпт",
          userMessage: "Как сделать промпт более кинематографичным?",
          botResponse:
            'Для кинематографичности избегай общих фраз:\n\n**ПЛОХО -> ХОРОШО:**\n- "cinematic look" -> "anamorphic 2.0x lens, shallow DOF, volumetric light"\n- "beautiful street" -> "wet asphalt, neon signs reflecting in puddles, zebra crosswalk"\n- "person moves" -> "takes three steps, pauses, looks back over shoulder"\n\n**Добавь специфику:**\n- Линза: anamorphic 2.0x, 35mm, 85mm prime\n- DOF: shallow depth of field, bokeh in background\n- Свет: soft window light with warm fill, cool rim light\n- Цвета: 3-5 якорных цветов (teal and orange, cyan and magenta)\n- Зерно: film grain, 35mm texture\n\n**Формула:**\n[Lens] + [DOF] + [Lighting] + [Color palette] + [Texture]',
        },
      ],
    },

    knowledge: {
      sources: [
        {
          type: "md_directory",
          path: "knowledge-base/video-prompting",
          name: "Video Prompting Guides",
          description: "Гайды по Sora 2 и Veo 3 от OpenAI и Google",
        },
      ],
      embeddingModel: "nomic-embed-text",
      searchLimit: 5,
      minSimilarity: 0.7,
    },

    videoPrompting: {
      supportedModels: ["sora2", "veo3", "kling", "runway"],

      promptLayers: [
        {
          name: "Cinematography",
          description: "Камера, кадр, движение",
          keywords: [
            "dolly",
            "tracking",
            "crane",
            "POV",
            "pan",
            "tilt",
            "zoom",
            "static",
            "handheld",
          ],
          examples: [
            "Slow dolly push toward subject",
            "Tracking shot following from camera left",
            "Crane shot rising to reveal cityscape",
            "POV shot, handheld movement",
            "Static wide shot, deep focus",
          ],
        },
        {
          name: "Subject",
          description: "Главный объект/персонаж",
          keywords: [
            "character",
            "protagonist",
            "object",
            "figure",
            "person",
            "man",
            "woman",
          ],
          examples: [
            "A woman in her 30s with short black hair, wearing a red coat",
            "A vintage red sports car, chrome details gleaming",
            "An elderly man in a tweed jacket, reading glasses",
          ],
        },
        {
          name: "Action",
          description: "Действие по битам (тайминг)",
          keywords: [
            "walks",
            "turns",
            "reaches",
            "pauses",
            "beats",
            "looks",
            "lifts",
            "sets",
          ],
          examples: [
            "Takes three steps, pauses, looks back over shoulder",
            "Lifts cup, sips slowly, sets down on saucer",
            "Turns toward camera in final second, slight smile",
          ],
        },
        {
          name: "Context",
          description: "Окружение, время, погода",
          keywords: [
            "setting",
            "environment",
            "weather",
            "time",
            "location",
            "background",
          ],
          examples: [
            "Rain-soaked Tokyo street at night, neon signs reflecting",
            "Sunlit Mediterranean coastline, golden hour",
            "Cozy cafe interior, afternoon light through window",
          ],
        },
        {
          name: "Lighting",
          description: "Освещение и цветовая палитра",
          keywords: [
            "soft light",
            "hard light",
            "volumetric",
            "rim light",
            "fill",
            "key",
            "ambient",
          ],
          examples: [
            "Soft window light with warm fill, cool rim light",
            "Neon glow, cyan and magenta palette, wet reflections",
            "Golden hour sunlight, warm oranges, soft shadows",
          ],
        },
        {
          name: "Audio",
          description: "Звук, диалог, амбиент (особенно для Veo 3)",
          keywords: [
            "ambient",
            "dialogue",
            "SFX",
            "music",
            "sound",
            "says",
            "speaks",
          ],
          examples: [
            "Distant city traffic, rain on glass",
            "He says: Your usual? (no subtitles)",
            "Ambient: coffee machine hissing, soft jazz in background",
          ],
        },
      ],

      cameraTemplates: [
        {
          name: "Dolly Push",
          description: "Плавное приближение к объекту",
          prompt: "Slow dolly push toward",
        },
        {
          name: "Dolly Pull",
          description: "Плавное отдаление от объекта",
          prompt: "Slow dolly pull away from",
        },
        {
          name: "Tracking Left",
          description: "Слежение слева направо",
          prompt: "Tracking shot from camera left",
        },
        {
          name: "Tracking Right",
          description: "Слежение справа налево",
          prompt: "Tracking shot from camera right",
        },
        {
          name: "Crane Up",
          description: "Подъём камеры вверх",
          prompt: "Crane shot rising to reveal",
        },
        {
          name: "Crane Down",
          description: "Спуск камеры вниз",
          prompt: "Crane shot descending toward",
        },
        {
          name: "POV",
          description: "От первого лица",
          prompt: "POV shot, handheld movement",
        },
        {
          name: "Static Wide",
          description: "Статичный общий план",
          prompt: "Static wide shot, deep focus, locked-off camera",
        },
        {
          name: "Over Shoulder",
          description: "Через плечо персонажа",
          prompt: "Over-the-shoulder shot, shallow DOF",
        },
        {
          name: "Orbit",
          description: "Круговое движение вокруг объекта",
          prompt: "Slow orbit around subject, 180 degrees",
        },
      ],

      lightingTemplates: [
        {
          name: "Golden Hour",
          description: "Тёплый закатный свет",
          prompt:
            "Golden hour sunlight, warm oranges and soft purples, long shadows, soft key light",
        },
        {
          name: "Neon Noir",
          description: "Неоновый нуар (киберпанк)",
          prompt:
            "Neon signs reflecting on wet surfaces, cyan and magenta palette, high contrast, volumetric haze",
        },
        {
          name: "Studio Soft",
          description: "Мягкий студийный свет",
          prompt:
            "Soft key light with fill, minimal shadows, clean background, professional lighting setup",
        },
        {
          name: "Dramatic Rim",
          description: "Драматичный контровой свет",
          prompt:
            "Strong rim light from behind, silhouette effect, high contrast, minimal fill",
        },
        {
          name: "Natural Overcast",
          description: "Естественный пасмурный свет",
          prompt:
            "Soft overcast daylight, no harsh shadows, even illumination, natural color temperature",
        },
        {
          name: "Window Light",
          description: "Свет из окна",
          prompt:
            "Soft window light from camera left, warm fill light, subtle shadows, natural falloff",
        },
      ],

      examplePrompts: [
        {
          model: "sora2",
          description: "Городской закат на крыше",
          prompt:
            "Slow dolly push. A woman in her 30s stands on a rooftop terrace, wind gently moving her hair. She watches the sunset over a modern city skyline. Golden hour lighting, warm oranges and soft purples. She turns toward camera in final second, slight smile. Anamorphic 2.0x lens, shallow depth of field. Ambient: distant traffic, wind. 4 seconds.",
          duration: "4s",
        },
        {
          model: "veo3",
          description: "Кафе сцена с диалогом",
          prompt:
            "Medium shot, tracking right. A barista in a vintage apron prepares espresso in a cozy cafe. Steam rises from the machine. Soft window light, film grain. He says: Your usual? (no subtitles). Ambient: coffee machine hissing, soft jazz in background. 6 seconds.",
          duration: "6s",
        },
        {
          model: "sora2",
          description: "Ночной Токио в дождь",
          prompt:
            "Tracking shot following from camera left. A cyclist in a yellow raincoat pedals through a rain-soaked Tokyo street at night. Neon signs reflect in puddles on wet asphalt. Cyclist takes three pedal strokes, brakes gently, stops at zebra crosswalk. Anamorphic 2.0x lens, cyan and magenta color palette, volumetric rain. 6 seconds.",
          duration: "6s",
        },
        {
          model: "veo3",
          description: "Интервью в офисе",
          prompt:
            "Medium close-up, static shot, shallow depth of field. A tech entrepreneur in a casual blazer sits in a modern office, glass walls behind her blurred. Natural window light from camera right, subtle fill. She says: We're building the future, one line of code at a time. (no subtitles). Ambient: quiet office hum, distant keyboard clicks. 8 seconds.",
          duration: "8s",
        },
      ],
    },

    behavior: {
      minIntervalMs: 5000,
      maxMessagesPerHour: 40,
      proactiveEnabled: false,
      proactiveIntervalMinutes: 120,
    },
  },

  /**
   * Photo Expert - ПРОАКТИВНЫЙ эксперт по созданию промптов для AI-изображений
   * Midjourney v6/v7, DALL-E 3, Flux 2, Stable Diffusion
   * Сам предлагает сделать промпты и помочь с генерацией фото!
   */
  photoExpert: {
    id: "photo-prompt-expert",
    name: "Photo Prompt Expert",
    username: "neuro_photo_expert_bot",

    targetChats: [
      {
        chatId: "2643951085",
        chatName: "Основной чат обучения",
        type: "supergroup",
        isActive: true,
        responseProbability: 1.0,
        customTriggers: [
          "напиши промпт",
          "помоги с промптом",
          "как написать промпт",
          "нужен промпт для",
          "сгенерируй картинку",
        ],
      },
      {
        chatId: "2737186844",
        chatName: "Группа нейросетей",
        type: "supergroup",
        isActive: true,
        responseProbability: 0.8,
      },
      {
        chatId: "144022504",
        chatName: "Тестовый личный чат",
        type: "private",
        isActive: true,
        responseProbability: 1.0,
      },
    ],

    triggers: {
      words: [
        // Модели
        "midjourney",
        "миджорни",
        "мидджорни",
        "dalle",
        "dall-e",
        "далли",
        "flux",
        "флакс",
        "stable diffusion",
        "стейбл",
        "ideogram",

        // Запросы
        "фото промпт",
        "photo prompt",
        "промпт для картинки",
        "промпт для фото",
        "сгенерируй картинку",
        "нарисуй",
        "сделай картинку",
        "как написать промпт",

        // Стили
        "фотореализм",
        "аниме стиль",
        "oil painting",
        "digital art",
        "3d render",
      ],
      categories: ["IMAGE_GENERATION", "AI_ART", "PROMPT_ENGINEERING"],
      requireMention: false,
      responseProbability: 1.0,
    },

    style: {
      language: "ru",
      formality: "casual",
      emojisAllowed: false,
      maxResponseLength: 1800,
      adjectives: [
        "творческий",
        "вдохновляющий",
        "детальный",
        "художественный",
      ],
      slangs: [],
      responseExamples: [
        // === Проактивные предложения ===
        {
          context: "Проактивное предложение помощи",
          userMessage: "[пользователь обсуждает генерацию изображений]",
          botResponse:
            "Привет! Вижу, вы работаете с AI-картинками. Могу помочь составить промпт для любой модели - Midjourney, DALL-E 3, Flux. Просто опиши что хочешь увидеть, я сделаю профессиональный промпт с правильной структурой и параметрами!",
        },
        {
          context: "Пользователь хочет промпт для Midjourney",
          userMessage: "Напиши промпт для Midjourney - красивый закат",
          botResponse:
            'Вот промпт для Midjourney v7:\n\n"Breathtaking sunset over calm ocean, dramatic cloud formations painted in vibrant orange and purple hues, golden hour light reflecting on water surface, silhouette of distant sailboat, photorealistic, cinematic composition, shot on Hasselblad X2D, 8k resolution"\n\n**Параметры:**\n--ar 16:9 --stylize 750 --v 7\n\n**Разбор:**\n- Subject: sunset + ocean\n- Style: photorealistic, cinematic\n- Camera: Hasselblad (высокая детализация)\n- --stylize 750: баланс между точностью и креативом',
        },
        {
          context: "Пользователь хочет промпт для DALL-E 3",
          userMessage: "Сделай промпт для DALL-E - космонавт",
          botResponse:
            'Промпт для DALL-E 3:\n\n"An astronaut floating in zero gravity inside a futuristic space station, looking through a large window at Earth below. The astronaut\'s helmet visor reflects the blue planet. Dramatic lighting from the sun creates lens flares. Hyper-realistic digital art style with attention to fabric textures and metallic surfaces."\n\n**Советы для DALL-E 3:**\n- Пиши естественным языком, не нужны теги\n- Используй описательные прилагательные\n- DALL-E сам улучшит промпт\n- Избегай негативных инструкций ("no", "without")',
        },
        {
          context: "Пользователь хочет промпт для Flux",
          userMessage: "Помоги с промптом для Flux",
          botResponse:
            'Для Flux используй структуру Subject + Action + Style + Context:\n\n"Red fox sitting in tall grass, wildlife documentary photography, misty dawn, soft golden light filtering through fog, shallow depth of field, shot on Canon EOS R5, 85mm lens, f/1.4"\n\n**Важно для Flux:**\n- Главное в начале (Flux взвешивает первые слова сильнее)\n- 15-75 слов оптимально\n- Можно использовать HEX-цвета: "primary color #FF6B35"\n- Нет negative prompts - пиши что ХОЧЕШЬ видеть\n- Указывай конкретную камеру для стиля',
        },
        {
          context: "Пользователь спрашивает разницу между моделями",
          userMessage: "Чем отличаются Midjourney, DALL-E и Flux?",
          botResponse:
            "Ключевые отличия:\n\n**Midjourney v7:**\n- Художественный стиль по умолчанию\n- Параметры --ar, --stylize, --chaos\n- Multi-prompts через ::\n- Лучший для арта и концептов\n\n**DALL-E 3:**\n- Понимает естественный язык\n- Автоматически улучшает промпты\n- Интеграция с ChatGPT\n- Лучший для точного следования инструкциям\n\n**Flux 2:**\n- Dual encoder (T5 + CLIP)\n- Subject первым в промпте\n- HEX цвета, JSON-prompts\n- Лучший для фотореализма и продуктовых фото\n\nДля какой модели написать промпт?",
        },
        {
          context: "Пользователь хочет кинематографичный портрет",
          userMessage: "Хочу кинематографичный портрет девушки",
          botResponse:
            'Вот промпт для кинематографичного портрета:\n\n**Midjourney:**\n"Cinematic portrait of a young woman, dramatic rim lighting, teal and orange color grading, shallow depth of field, anamorphic lens flare, film grain, shot on ARRI Alexa, 85mm Cooke S4 lens, moody atmosphere" --ar 2:1 --stylize 500\n\n**Flux:**\n"Young woman portrait, dramatic cinematic lighting with strong rim light from behind, teal and orange color palette, shallow depth of field with creamy bokeh, film grain texture, shot on ARRI Alexa with Cooke S4 85mm lens"\n\n**Ключ к кинематографичности:**\n- Anamorphic lens / lens flare\n- Teal and orange grading\n- Film grain\n- Конкретная камера (ARRI, RED)',
        },
      ],
    },

    knowledge: {
      sources: [
        {
          type: "md_directory",
          path: "knowledge-base/photo-prompting",
          name: "Photo Prompting Guides",
          description: "Гайды по Midjourney, DALL-E 3, Flux",
        },
      ],
      embeddingModel: "nomic-embed-text",
      searchLimit: 5,
      minSimilarity: 0.7,
    },

    photoPrompting: {
      supportedModels: [
        "midjourney",
        "dalle3",
        "flux",
        "stable-diffusion",
        "ideogram",
      ],

      promptLayers: [
        {
          name: "Subject",
          description: "Главный объект/персонаж (ВСЕГДА первым!)",
          keywords: [
            "portrait",
            "landscape",
            "product",
            "character",
            "object",
            "scene",
          ],
          examples: [
            "A young woman with red hair",
            "Majestic mountain landscape",
            "Sleek sports car",
            "Cute corgi puppy",
          ],
        },
        {
          name: "Style",
          description: "Художественный стиль",
          keywords: [
            "photorealistic",
            "oil painting",
            "watercolor",
            "digital art",
            "anime",
            "3d render",
            "sketch",
          ],
          examples: [
            "Photorealistic, cinematic",
            "Oil painting in the style of Monet",
            "Studio Ghibli anime style",
            "Pixar 3D animation style",
          ],
        },
        {
          name: "Lighting",
          description: "Освещение сцены",
          keywords: [
            "golden hour",
            "dramatic",
            "soft light",
            "rim light",
            "studio",
            "natural",
            "neon",
          ],
          examples: [
            "Golden hour sunlight",
            "Dramatic rim lighting",
            "Soft studio lighting with key and fill",
            "Neon city lights reflecting",
          ],
        },
        {
          name: "Camera",
          description: "Камера и настройки",
          keywords: [
            "Hasselblad",
            "Canon",
            "Sony",
            "85mm",
            "35mm",
            "wide angle",
            "macro",
            "f/1.4",
          ],
          examples: [
            "Shot on Hasselblad X2D, 85mm",
            "Canon EOS R5, 35mm f/1.4",
            "Macro photography, extreme close-up",
            "Wide angle lens, dramatic perspective",
          ],
        },
        {
          name: "Composition",
          description: "Композиция кадра",
          keywords: [
            "rule of thirds",
            "centered",
            "symmetry",
            "leading lines",
            "close-up",
            "wide shot",
          ],
          examples: [
            "Rule of thirds composition",
            "Perfectly centered, symmetrical",
            "Close-up portrait, shallow DOF",
            "Wide establishing shot",
          ],
        },
        {
          name: "Mood",
          description: "Настроение и атмосфера",
          keywords: [
            "moody",
            "cheerful",
            "mysterious",
            "ethereal",
            "dark",
            "vibrant",
            "peaceful",
          ],
          examples: [
            "Moody, atmospheric",
            "Cheerful and vibrant colors",
            "Mysterious foggy atmosphere",
            "Ethereal, dreamlike quality",
          ],
        },
      ],

      styleTemplates: [
        {
          name: "Photorealistic",
          description: "Фотореалистичный стиль",
          prompt:
            "photorealistic, hyperrealistic, 8k resolution, highly detailed, sharp focus",
          bestFor: ["flux", "midjourney", "dalle3"],
        },
        {
          name: "Cinematic",
          description: "Кинематографичный стиль",
          prompt:
            "cinematic, film still, anamorphic lens, dramatic lighting, color grading, film grain",
          bestFor: ["midjourney", "flux"],
        },
        {
          name: "Oil Painting",
          description: "Масляная живопись",
          prompt:
            "oil painting, thick brushstrokes, rich colors, canvas texture, classical art",
          bestFor: ["midjourney", "dalle3"],
        },
        {
          name: "Anime",
          description: "Аниме стиль",
          prompt:
            "anime style, cel shading, vibrant colors, detailed eyes, Studio Ghibli inspired",
          bestFor: ["midjourney", "stable-diffusion"],
        },
        {
          name: "3D Render",
          description: "3D рендер",
          prompt:
            "3D render, Octane render, Blender, subsurface scattering, ray tracing, studio lighting",
          bestFor: ["midjourney", "dalle3"],
        },
        {
          name: "Watercolor",
          description: "Акварель",
          prompt:
            "watercolor painting, soft washes, bleeding colors, paper texture, delicate details",
          bestFor: ["midjourney", "dalle3"],
        },
        {
          name: "Cyberpunk",
          description: "Киберпанк стиль",
          prompt:
            "cyberpunk aesthetic, neon lights, rain-soaked streets, holographic ads, high tech low life",
          bestFor: ["midjourney", "flux", "stable-diffusion"],
        },
        {
          name: "Fantasy",
          description: "Фэнтези стиль",
          prompt:
            "fantasy art, epic, magical atmosphere, ethereal lighting, detailed environment",
          bestFor: ["midjourney", "stable-diffusion"],
        },
      ],

      modelParameters: [
        {
          name: "Aspect Ratio",
          syntax: "--ar",
          description: "Соотношение сторон изображения",
          examples: ["--ar 16:9", "--ar 1:1", "--ar 2:3", "--ar 9:16"],
          models: ["midjourney"],
        },
        {
          name: "Stylize",
          syntax: "--stylize",
          description: "Уровень художественной стилизации (0-1000)",
          examples: ["--stylize 250", "--stylize 500", "--stylize 750"],
          models: ["midjourney"],
        },
        {
          name: "Chaos",
          syntax: "--chaos",
          description: "Уровень вариативности (0-100)",
          examples: ["--chaos 0", "--chaos 50", "--chaos 100"],
          models: ["midjourney"],
        },
        {
          name: "Version",
          syntax: "--v",
          description: "Версия модели Midjourney",
          examples: ["--v 6", "--v 7"],
          models: ["midjourney"],
        },
        {
          name: "Image Weight",
          syntax: "--iw",
          description: "Вес референсного изображения (0-2)",
          examples: ["--iw 0.5", "--iw 1", "--iw 2"],
          models: ["midjourney"],
        },
        {
          name: "Multi-Prompt",
          syntax: "::",
          description: "Разделитель для взвешивания частей промпта",
          examples: ["cat::2 dog::1", "forest::3 cabin::1"],
          models: ["midjourney"],
        },
      ],

      examplePrompts: [
        {
          model: "midjourney",
          description: "Кинематографичный портрет",
          prompt:
            "Cinematic portrait of a young woman with flowing auburn hair, dramatic rim lighting, teal and orange color grading, anamorphic lens flare, shallow depth of field, film grain, shot on ARRI Alexa",
          parameters: "--ar 2:1 --stylize 500 --v 7",
        },
        {
          model: "dalle3",
          description: "Фантастический пейзаж",
          prompt:
            "A breathtaking fantasy landscape with floating islands covered in lush vegetation, waterfalls cascading into clouds below, ancient stone ruins with glowing runes, golden sunset light piercing through dramatic clouds, highly detailed digital art",
        },
        {
          model: "flux",
          description: "Продуктовая фотография",
          prompt:
            "Premium wireless headphones on minimalist white surface, soft studio lighting with gentle shadows, product photography, shot on Phase One IQ4, 120mm macro lens, f/8, color #2D2D2D for headphones, pristine white background",
        },
        {
          model: "midjourney",
          description: "Киберпанк город",
          prompt:
            "Cyberpunk city street at night, neon signs in Japanese and English, rain-soaked asphalt reflecting colorful lights, flying cars in the distance, dense urban environment, blade runner aesthetic, volumetric fog",
          parameters: "--ar 21:9 --stylize 750 --v 7",
        },
        {
          model: "flux",
          description: "Портрет с естественным светом",
          prompt:
            "Portrait of elderly craftsman in workshop, warm natural window light from camera left, dust particles visible in light beams, weathered hands holding woodworking tool, shallow depth of field, documentary photography style, shot on Leica M11",
        },
      ],
    },

    // ПРОАКТИВНЫЙ агент - сам предлагает помощь!
    sales: {
      productName: "Photo Prompt Expert",
      price: "Бесплатно!",
      ctaTemplate: "Хочешь крутой промпт? Просто опиши что хочешь увидеть!",
      objectionHandlers: {
        сложно:
          "Совсем не сложно! Опиши картинку словами, я сделаю профессиональный промпт.",
        "не умею":
          "Я помогу! Просто скажи что хочешь увидеть - кота, закат, портрет?",
        долго: "Промпт готов за секунды! Попробуй прямо сейчас.",
      },
      mentorContact: "@neuro_photo_expert_bot",
      urgencyTriggers: ["помоги с промптом", "нужен промпт", "не получается"],
      features: [
        "Промпты для Midjourney, DALL-E 3, Flux, Stable Diffusion",
        "Правильные параметры (--ar, --stylize, --v)",
        "Объяснение структуры промпта",
        "Советы по улучшению результата",
      ],
      fomoMessages: [
        "Уже помог 50+ людям написать крутые промпты сегодня!",
        "Последний промпт получил 100 лайков в группе!",
        "Кто хочет промпт для своей идеи? Пишите!",
      ],
    },

    behavior: {
      minIntervalMs: 3000,
      maxMessagesPerHour: 30,
      // ПРОАКТИВНЫЙ режим включён!
      proactiveEnabled: true,
      proactiveIntervalMinutes: 180, // Каждые 3 часа предлагает помощь
    },
  },

  /**
   * Music Expert - эксперт по созданию музыкальных промптов для AI
   * Специализация: Suno, Udio, генерация музыки
   */
  musicExpert: {
    id: "music-prompt-expert",
    name: "Music Prompt Expert",
    username: "neuro_music_bot",

    targetChats: [
      {
        chatId: "2643951085",
        chatName: "Основной чат обучения",
        type: "supergroup",
        isActive: true,
        responseProbability: 1.0,
      },
      {
        chatId: "2737186844",
        chatName: "Нейро чат (группа)",
        type: "supergroup",
        isActive: true,
        responseProbability: 1.0,
      },
      {
        chatId: "144022504",
        chatName: "Тестовый личный чат",
        type: "private",
        isActive: true,
        responseProbability: 1.0,
      },
    ],

    triggers: {
      words: [
        // Suno
        "suno",
        "суно",
        "сано",
        // Udio
        "udio",
        "удио",
        "юдио",
        // Общие
        "музыка",
        "music",
        "песня",
        "song",
        "трек",
        "track",
        "сгенерировать музыку",
        "создать музыку",
        "написать песню",
        "музыкальный промпт",
        "music prompt",
        "ai музыка",
        "нейро музыка",
        // Жанры
        "бит",
        "beat",
        "лирика",
        "lyrics",
        "хип-хоп",
        "hip-hop",
        "поп",
        "pop",
        "рок",
        "rock",
        "электро",
        "electronic",
        "lo-fi",
        "lofi",
      ],
      categories: ["MUSIC_GENERATION", "AI_MUSIC", "CREATIVE"],
      requireMention: false,
      responseProbability: 1.0,
    },

    style: {
      language: "ru",
      formality: "professional",
      emojisAllowed: true,
      maxResponseLength: 2500,
      adjectives: ["технический", "музыкальный", "креативный", "детальный"],
      slangs: ["бит", "дроп", "хук", "бридж", "аутро"],
      responseExamples: [
        {
          context: "Пользователь хочет промпт для Suno",
          userMessage:
            "Напиши промпт для Suno - грустную песню про расставание",
          botResponse:
            'Вот структурированный промпт для Suno:\n\n**Жанр:** Melancholic indie pop\n**Настроение:** Sad, heartfelt, emotional\n**Инструменты:** Acoustic guitar, soft piano, strings\n**Вокал:** Soft female vocals with vulnerability\n**Темп:** Slow, ~75 BPM\n\n**Полный промпт:**\n"Melancholic indie pop, soft female vocals, acoustic guitar with gentle piano, sad and heartfelt, emotional strings swell, about lost love, 75 BPM"\n\n**Структура:**\n[Verse 1]\n[Chorus]\n[Verse 2]\n[Chorus]\n[Bridge]\n[Chorus]\n[Outro]',
        },
        {
          context: "Пользователь спрашивает разницу Suno vs Udio",
          userMessage: "Чем отличаются Suno и Udio?",
          botResponse:
            "Основные отличия:\n\n**Suno:**\n- Мета-теги для структуры [Verse], [Chorus]\n- 1200+ жанров, треки до 8 минут\n- Лучше для полных песен с вокалом\n- Быстрая генерация\n\n**Udio:**\n- Студийное качество звука\n- Генерация за 30 секунд\n- Remix и Inpainting функции\n- Реалистичный вокал\n- Лучше для коротких сниппетов\n\n**Общее:** Оба отлично миксуют жанры. Формула: Genre + Mood + Instruments + Tempo.",
        },
        {
          context: "Пользователь хочет трэп бит",
          userMessage: "Сделай промпт для трэп бита",
          botResponse:
            'Трэп бит для Suno/Udio:\n\n**Промпт:**\n"Dark trap beat, heavy 808 bass, rolling hi-hats, ominous synth melody, aggressive energy, hard-hitting kicks, 145 BPM"\n\n**Для Suno добавь структуру:**\n[Intro] 4 bar 808 pattern\n[Verse] Dark melody with rolling hats\n[Drop] Bass heavy, intense\n[Verse]\n[Drop]\n[Outro] Fade\n\n**Ключевые элементы трэпа:**\n- 808 bass (тяжёлый суб-бас)\n- Rolling hi-hats (быстрые хэты)\n- Hard kicks (жёсткие кики)\n- BPM: 130-160',
        },
        {
          context: "Пользователь хочет лофай",
          userMessage: "Как написать промпт для lo-fi?",
          botResponse:
            'Lo-Fi промпт:\n\n**Формула:**\nChill + lo-fi + [инструменты] + [текстура] + [настроение] + [BPM]\n\n**Пример:**\n"Chill lo-fi hip-hop, soft piano chords, mellow guitar, vinyl crackle texture, jazzy vibes, relaxing study music, 85 BPM"\n\n**Ключевые элементы:**\n- vinyl crackle - треск пластинки\n- soft drums - мягкие ударные\n- jazzy samples - джазовые семплы\n- mellow - мягкий, расслабленный\n- BPM: 70-90\n\n**Атмосфера:** late night study, rainy day, cozy cafe',
        },
      ],
    },

    knowledge: {
      sources: [
        {
          type: "md_file",
          path: "knowledge-base/music-prompting/suno-guide.md",
          name: "Suno Guide",
          description: "Гайд по промптам для Suno AI",
        },
        {
          type: "md_file",
          path: "knowledge-base/music-prompting/udio-guide.md",
          name: "Udio Guide",
          description: "Гайд по промптам для Udio AI",
        },
      ],
      embeddingModel: "nomic-embed-text",
      searchLimit: 5,
      minSimilarity: 0.7,
    },

    sales: {
      productName: "Music Prompting Mastery",
      price: "от 990 руб",
      ctaTemplate: "Хочешь создавать хиты с помощью AI? Напиши мне!",
      objectionHandlers: {
        дорого:
          "За эту цену ты получишь навык, который будет приносить доход. Один качественный трек для рекламы стоит от 5000 руб.",
        "сам разберусь":
          "Конечно! Но учти, что правильная структура промпта экономит часы генераций. Я покажу короткий путь.",
      },
      mentorContact: "@vibee_mentor",
      urgencyTriggers: ["AI музыка", "монетизация треков", "музыка для видео"],
      features: [
        "Промпты для Suno и Udio",
        "Структура песни (verse, chorus, bridge)",
        "Мета-теги для контроля",
        "Жанровые шаблоны",
        "Монетизация AI музыки",
      ],
      fomoMessages: [
        "Suno v4.5 вышла! Новые возможности ждут",
        "AI музыка - тренд 2025. Начни сейчас!",
        "Уже 100+ человек делают музыку с помощью AI",
      ],
    },

    musicPrompting: {
      supportedModels: ["suno", "udio", "boomy", "aiva"],

      promptLayers: [
        {
          name: "Genre & Style",
          description: "Жанр и стиль музыки",
          keywords: [
            "pop",
            "rock",
            "hip-hop",
            "electronic",
            "jazz",
            "classical",
            "lo-fi",
            "indie",
          ],
          examples: [
            "upbeat indie pop",
            "dark trap beat",
            "dreamy lo-fi hip-hop",
          ],
        },
        {
          name: "Mood & Emotion",
          description: "Настроение и эмоция",
          keywords: [
            "happy",
            "sad",
            "energetic",
            "calm",
            "melancholic",
            "triumphant",
            "mysterious",
          ],
          examples: [
            "melancholic and introspective",
            "uplifting and energetic",
            "dark and mysterious",
          ],
        },
        {
          name: "Instrumentation",
          description: "Инструменты и звуки",
          keywords: [
            "piano",
            "guitar",
            "synth",
            "drums",
            "bass",
            "strings",
            "808s",
            "brass",
          ],
          examples: [
            "acoustic guitar and soft piano",
            "heavy 808s and trap hi-hats",
            "orchestral strings",
          ],
        },
        {
          name: "Tempo & Energy",
          description: "Темп и энергия",
          keywords: ["BPM", "slow", "fast", "moderate", "building", "dropping"],
          examples: [
            "around 120 BPM",
            "slow 70-75 BPM",
            "high energy ~140 BPM",
          ],
        },
        {
          name: "Vocals",
          description: "Вокал и его характеристики",
          keywords: [
            "male",
            "female",
            "soft",
            "powerful",
            "autotuned",
            "raspy",
            "harmonies",
          ],
          examples: [
            "soft female vocals",
            "powerful male voice",
            "autotuned melodic vocals",
          ],
        },
        {
          name: "Production",
          description: "Продакшн и обработка",
          keywords: [
            "reverb",
            "lo-fi",
            "clean",
            "distorted",
            "ambient",
            "punchy",
            "crisp",
          ],
          examples: [
            "lo-fi texture with vinyl crackle",
            "crisp modern production",
            "heavy reverb",
          ],
        },
      ],

      genreTemplates: [
        {
          name: "Pop",
          description: "Поп музыка с запоминающимся хуком",
          promptKeywords: [
            "catchy hook",
            "bright melody",
            "modern production",
            "radio-friendly",
          ],
          instruments: ["synth", "drums", "bass", "piano"],
          bpmRange: "100-130",
          bestModels: ["suno", "udio"],
        },
        {
          name: "Hip-Hop / Trap",
          description: "Хип-хоп и трэп биты",
          promptKeywords: [
            "heavy bass",
            "808s",
            "trap hi-hats",
            "rolling snares",
          ],
          instruments: ["808 bass", "hi-hats", "snare", "synth leads"],
          bpmRange: "130-160",
          bestModels: ["suno", "udio"],
        },
        {
          name: "Lo-Fi",
          description: "Лофай для учёбы и отдыха",
          promptKeywords: [
            "chill",
            "relaxing",
            "vinyl crackle",
            "jazz samples",
            "mellow",
          ],
          instruments: ["piano", "guitar", "soft drums", "bass"],
          bpmRange: "70-90",
          bestModels: ["suno", "udio"],
        },
        {
          name: "Electronic / EDM",
          description: "Электронная танцевальная музыка",
          promptKeywords: [
            "build-up",
            "drop",
            "synth leads",
            "bass wobble",
            "festival",
          ],
          instruments: ["synths", "bass", "kicks", "claps"],
          bpmRange: "120-150",
          bestModels: ["suno", "udio"],
        },
        {
          name: "Rock",
          description: "Рок музыка с гитарами",
          promptKeywords: [
            "electric guitar",
            "driving drums",
            "powerful",
            "anthem",
          ],
          instruments: ["electric guitar", "bass guitar", "drums", "vocals"],
          bpmRange: "100-140",
          bestModels: ["suno", "udio"],
        },
        {
          name: "Cinematic",
          description: "Кинематографическая музыка",
          promptKeywords: [
            "epic",
            "orchestral",
            "emotional",
            "dramatic",
            "sweeping",
          ],
          instruments: ["strings", "brass", "choir", "percussion"],
          bpmRange: "60-120",
          bestModels: ["aiva", "suno"],
        },
      ],

      metaTags: [
        {
          tag: "[Intro]",
          description: "Вступление песни",
          syntax: "[Intro]",
          examples: ["[Intro] Soft piano intro", "[Intro] 4 bar drum pattern"],
          models: ["suno"],
        },
        {
          tag: "[Verse]",
          description: "Куплет",
          syntax: "[Verse] или [Verse 1]",
          examples: [
            "[Verse 1] Walking down the street",
            "[Verse] Мелодичный куплет",
          ],
          models: ["suno", "udio"],
        },
        {
          tag: "[Chorus]",
          description: "Припев",
          syntax: "[Chorus]",
          examples: [
            "[Chorus] This is where we shine",
            "[Chorus] Энергичный припев",
          ],
          models: ["suno", "udio"],
        },
        {
          tag: "[Bridge]",
          description: "Бридж - переходная часть",
          syntax: "[Bridge]",
          examples: [
            "[Bridge] Slow down, add tension",
            "[Bridge] Change the mood",
          ],
          models: ["suno"],
        },
        {
          tag: "[Drop]",
          description: "Дроп в электронной музыке",
          syntax: "[Drop]",
          examples: ["[Drop] Heavy bass drop", "[Drop] Explosive energy"],
          models: ["suno"],
        },
        {
          tag: "[Outro]",
          description: "Концовка песни",
          syntax: "[Outro]",
          examples: ["[Outro] Fade out", "[Outro] Final chorus repeat"],
          models: ["suno", "udio"],
        },
      ],

      examplePrompts: [
        {
          model: "suno",
          description: "Поп песня с запоминающимся хуком",
          prompt:
            "Upbeat indie pop, bright acoustic guitar, catchy female vocals, feel-good summer vibes, modern production, 115 BPM",
          metaTags: "[Verse][Chorus][Verse][Chorus][Bridge][Chorus]",
          genre: "Pop",
        },
        {
          model: "suno",
          description: "Трэп бит с 808",
          prompt:
            "Dark trap beat, heavy 808 bass, rolling hi-hats, ominous synth melody, male autotuned vocals, aggressive energy, 145 BPM",
          metaTags: "[Intro][Verse][Drop][Verse][Drop][Outro]",
          genre: "Hip-Hop / Trap",
        },
        {
          model: "udio",
          description: "Лофай для учёбы",
          prompt:
            "Chill lo-fi hip-hop, soft piano chords, mellow guitar, vinyl crackle texture, jazzy vibes, relaxing study music, 85 BPM",
          genre: "Lo-Fi",
        },
        {
          model: "suno",
          description: "Эпическая кинематографическая музыка",
          prompt:
            "Epic cinematic orchestral, triumphant brass fanfare, sweeping strings, powerful choir, building to emotional climax, heroic theme",
          metaTags: "[Intro][Build][Climax][Resolution]",
          genre: "Cinematic",
        },
        {
          model: "udio",
          description: "Рок антем",
          prompt:
            "Anthemic rock, driving electric guitars, powerful drums, arena-ready chorus, male rock vocals, inspirational lyrics, 125 BPM",
          genre: "Rock",
        },
      ],
    },

    behavior: {
      minIntervalMs: 3000,
      maxMessagesPerHour: 30,
      // ПРОАКТИВНЫЙ режим включён!
      proactiveEnabled: true,
      proactiveIntervalMinutes: 180, // Каждые 3 часа предлагает помощь
    },
  },
};

// ============================================
// ХЕЛПЕР-ФУНКЦИИ
// ============================================

/**
 * Получить конфигурацию агента по ID или username
 */
export function getAgentConfig(idOrUsername: string): AgentConfig | undefined {
  // Сначала ищем по ключу
  if (AGENTS_CONFIG[idOrUsername]) {
    return AGENTS_CONFIG[idOrUsername];
  }
  // Затем ищем по username
  return Object.values(AGENTS_CONFIG).find((a) => a.username === idOrUsername);
}

/**
 * Получить все целевые чаты (только активные)
 */
export function getAllTargetChats(): ChatTarget[] {
  return Object.values(AGENTS_CONFIG)
    .flatMap((a) => a.targetChats)
    .filter((c) => c.isActive);
}

/**
 * Получить ID всех активных чатов
 */
export function getAllTargetChatIds(): string[] {
  return getAllTargetChats().map((c) => c.chatId);
}

/**
 * Получить целевые чаты для конкретного агента
 */
export function getTargetChatsForAgent(agentId: string): ChatTarget[] {
  return AGENTS_CONFIG[agentId]?.targetChats.filter((c) => c.isActive) || [];
}

/**
 * Проверить, является ли чат целевым для агента
 */
export function isChatTargetForAgent(chatId: string, agentId: string): boolean {
  const normalizedChatId = normalizeChatId(chatId);
  const config = AGENTS_CONFIG[agentId];
  if (!config) return false;

  return config.targetChats.some(
    (c) => c.isActive && normalizeChatId(c.chatId) === normalizedChatId
  );
}

/**
 * Проверить, есть ли права на запись в чат
 * Возвращает true для личных чатов и чатов с canWrite !== false
 */
export function canWriteToChat(chatId: string): boolean {
  const normalizedChatId = normalizeChatId(chatId);

  // Личные чаты - всегда можем писать
  const chatIdNum = parseInt(normalizedChatId, 10);
  if (!isNaN(chatIdNum) && chatIdNum > 0 && chatIdNum < 1000000000) {
    return true;
  }

  // Ищем чат во всех агентах
  for (const config of Object.values(AGENTS_CONFIG)) {
    const chatTarget = config.targetChats.find(
      (c) => c.isActive && normalizeChatId(c.chatId) === normalizedChatId
    );
    if (chatTarget) {
      // Если canWrite явно false - нельзя писать
      if (chatTarget.canWrite === false) {
        return false;
      }
      // По умолчанию можно писать
      return true;
    }
  }

  // Чат не в списке - не пишем
  return false;
}

/**
 * Проверить, нужно ли отвечать в чате
 */
export function shouldRespondInChat(
  chatId: string,
  agentId: string,
  messageText: string,
  hasMention: boolean = false
): boolean {
  const config = AGENTS_CONFIG[agentId];
  if (!config) return false;

  const normalizedChatId = normalizeChatId(chatId);
  const chatTarget = config.targetChats.find(
    (c) => c.isActive && normalizeChatId(c.chatId) === normalizedChatId
  );

  // Если чат не в списке целевых - не отвечаем
  if (!chatTarget) return false;

  // Если нет прав на запись в чат - не отвечаем
  if (chatTarget.canWrite === false) {
    return false;
  }

  // Если требуется упоминание, но его нет
  if (config.triggers.requireMention && !hasMention) {
    return false;
  }

  // Собираем все триггеры
  const triggers = [
    ...config.triggers.words,
    ...(chatTarget.customTriggers || []),
  ];

  // Проверяем наличие триггера
  const lowerText = messageText.toLowerCase();
  const hasTrigger = triggers.some((t) => lowerText.includes(t.toLowerCase()));

  // Если есть триггер - отвечаем
  if (hasTrigger) {
    return true;
  }

  // Для личных чатов всегда отвечаем
  if (chatTarget.type === "private") {
    return true;
  }

  // Проверяем вероятность ответа
  const probability =
    chatTarget.responseProbability ?? config.triggers.responseProbability;
  return Math.random() < probability;
}

/**
 * Получить источники знаний для агента
 */
export function getKnowledgeSources(agentId: string): KnowledgeSourceConfig[] {
  return AGENTS_CONFIG[agentId]?.knowledge.sources || [];
}

/**
 * Получить настройки стиля для агента
 */
export function getStyleConfig(agentId: string): StyleConfig | undefined {
  return AGENTS_CONFIG[agentId]?.style;
}

/**
 * Получить настройки продаж для агента
 */
export function getSalesConfig(agentId: string): AgentSalesConfig | undefined {
  return AGENTS_CONFIG[agentId]?.sales;
}

/**
 * Получить настройки видео промптинга для агента
 */
export function getVideoPromptConfig(
  agentId: string
): VideoPromptConfig | undefined {
  return AGENTS_CONFIG[agentId]?.videoPrompting;
}

/**
 * Получить настройки фото промптинга для агента
 */
export function getPhotoPromptConfig(
  agentId: string
): PhotoPromptConfig | undefined {
  return AGENTS_CONFIG[agentId]?.photoPrompting;
}

/**
 * Получить настройки музыкального промптинга для агента
 */
export function getMusicPromptConfig(
  agentId: string
): MusicPromptConfig | undefined {
  return AGENTS_CONFIG[agentId]?.musicPrompting;
}

/**
 * Нормализация chatId (убираем -100 префикс)
 */
function normalizeChatId(chatId: string | number): string {
  const chatIdStr = String(chatId);
  return chatIdStr.replace(/^-100/, "");
}

/**
 * Получить список всех агентов
 */
export function getAllAgents(): AgentConfig[] {
  return Object.values(AGENTS_CONFIG);
}

/**
 * Получить ID всех агентов
 */
export function getAllAgentIds(): string[] {
  return Object.keys(AGENTS_CONFIG);
}

export default AGENTS_CONFIG;
