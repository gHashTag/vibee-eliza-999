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
      categories: ["VIBECODING", "PROGRAMMING", "AI_SPECIAL", "IMAGE_GENERATION"],
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
        isActive: true,
        customTriggers: ["вайбкодер", "дмитрий", "кольс"],
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
        isActive: true,
        responseProbability: 1.0,
        customTriggers: [
          "круто",
          "вау",
          "класс",
          "красиво",
          "нравится",
          "хочу",
          "мне тоже",
          "сколько стоит",
          "как сделать",
          "какие стили",
          "аватар",
          "фото",
          "картинка",
        ],
      },
    ],

    triggers: {
      words: [
        "круто получилось",
        "мне можешь",
        "хочу такое",
        "сколько стоит",
        "как это работает",
        "какие стили",
        "сделай мне",
        "@neuro_blogger_bot",
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
      adjectives: ["творческий", "восторженный", "дружелюбный", "художественный", "яркий"],
      slangs: [],
      responseExamples: [
        {
          context: "Пользователь восхищается результатом",
          userMessage: "Вау, круто получилось!",
          botResponse:
            "Спасибо! Это только один стиль из 8 доступных. Напиши @neuro_blogger_bot - покажу все варианты и сделаем тебе персональную серию!",
        },
        {
          context: "Пользователь хочет себе такое же",
          userMessage: "А мне можешь сделать?",
          botResponse:
            "Конечно! Пиши в личку @neuro_blogger_bot - скинь фото и выберем стиль. Через 30 секунд будет готово!",
        },
        {
          context: "Пользователь спрашивает о цене",
          userMessage: "Сколько стоит?",
          botResponse:
            "От 2 Stars (~3р) за картинку! Есть пакеты выгоднее. Пиши @neuro_blogger_bot - всё расскажу.",
        },
        {
          context: "Пользователь интересуется стилями",
          userMessage: "А какие стили есть?",
          botResponse:
            "8 крутых стилей:\n- Киберпанк (неон)\n- Акварель (мягкие краски)\n- Фэнтези (магия)\n- Поп-арт (яркие цвета)\n- Сюрреализм\n- Кинематограф\n- Ретро 80-х\n- Голография\n\nКакой ближе? Пиши @neuro_blogger_bot!",
        },
        {
          context: "Пользователь сомневается",
          userMessage: "Не, мне не надо",
          botResponse:
            "Окей! Если передумаешь - @neuro_blogger_bot всегда на связи. А пока можешь попробовать бесплатную функцию 'Мозг аватара' - обучи AI на своих текстах!",
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
      ctaTemplate: "Напиши @neuro_blogger_bot в личку - сделаю тебе креативное фото за 30 секунд!",
      objectionHandlers: {
        дорого:
          "От 3 рублей за картинку - дешевле чашки кофе! А качество как у профи-дизайнера.",
        сложно:
          "Всего 3 шага: напиши боту, скинь фото, выбери стиль. Через 30 сек готово!",
        "не надо":
          "Окей! Попробуй бесплатную функцию 'Мозг аватара' - обучи AI на своих текстах.",
        "потом":
          "Хорошо! @neuro_blogger_bot всегда на связи. Завтра сделаю креатив кому-то ещё из группы!",
      },
      mentorContact: "@neuro_blogger_bot",
      urgencyTriggers: ["хочу сейчас", "сделай мне", "быстро", "срочно"],
      features: [
        "8 художественных стилей",
        "Генерация за 30 секунд",
        "Киберпанк, акварель, поп-арт, фэнтези",
        "От 2 Stars за картинку",
        "Работает прямо в Telegram",
      ],
    },

    behavior: {
      minIntervalMs: 3000,
      maxMessagesPerHour: 20,
      proactiveEnabled: true,
      proactiveIntervalMinutes: 1440, // 24 часа = 1440 минут
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

  // Если нет триггера - не отвечаем (если не личный чат)
  if (!hasTrigger && chatTarget.type !== "private") {
    return false;
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
