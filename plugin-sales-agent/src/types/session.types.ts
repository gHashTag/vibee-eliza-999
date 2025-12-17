/**
 * Sales Agent Configurator - Session Types
 *
 * Типы для сессии конфигурации Sales Agent через пошаговый диалог
 */

/**
 * Шаги конфигурации (27 шагов)
 */
export enum SalesAgentStep {
  // === ОНБОРДИНГ (1 шаг) ===
  ONBOARDING = 'onboarding',

  // === БАЗОВАЯ ИНФОРМАЦИЯ (4 шага) ===
  NAME = 'name',
  USERNAME = 'username',
  SERVICE_NAME = 'service_name',
  SERVICE_DESCRIPTION = 'service_description',

  // === ЦЕНООБРАЗОВАНИЕ (3 шага) ===
  PRICE_MONTHLY = 'price_monthly',
  PRICE_CURRENCY = 'price_currency',
  PAYMENT_METHODS = 'payment_methods',

  // === ЦЕЛЕВАЯ АУДИТОРИЯ (2 шага) ===
  TARGET_AUDIENCE_SEGMENTS = 'target_audience_segments',
  TARGET_AUDIENCE_CUSTOM = 'target_audience_custom',

  // === ТРИГГЕРНЫЕ СЛОВА (3 шага) ===
  TRIGGERS_SERVICE = 'triggers_service',
  TRIGGERS_PAIN = 'triggers_pain',
  TRIGGERS_READINESS = 'triggers_readiness',

  // === СКРИПТЫ ПРОДАЖ (6 шагов) ===
  SCRIPT_GREETING = 'script_greeting',
  SCRIPT_VALUE_PROP = 'script_value_prop',
  SCRIPT_OBJECTION_1 = 'script_objection_1',
  SCRIPT_OBJECTION_2 = 'script_objection_2',
  SCRIPT_OBJECTION_3 = 'script_objection_3',
  SCRIPT_CLOSING = 'script_closing',

  // === СТИЛЬ ОБЩЕНИЯ (3 шага) ===
  TONE_FORMALITY = 'tone_formality',
  TONE_EMOTION = 'tone_emotion',
  TONE_LENGTH = 'tone_length',

  // === ПРИМЕРЫ ДИАЛОГОВ (4 шага) ===
  EXAMPLE_FIRST_CONTACT_USER = 'example_first_contact_user',
  EXAMPLE_FIRST_CONTACT_AGENT = 'example_first_contact_agent',
  EXAMPLE_OBJECTION_USER = 'example_objection_user',
  EXAMPLE_OBJECTION_AGENT = 'example_objection_agent',

  // === ФИНАЛ (2 шага) ===
  PREVIEW = 'preview',
  DONE = 'done',
}

/**
 * Тип услуги
 */
export type ServiceType =
  | 'consulting'    // Консалтинг / Коучинг
  | 'saas'          // SaaS / Программное обеспечение
  | 'content'       // Контент / Образование
  | 'fitness'       // Фитнес / Здоровье
  | 'marketing'     // Маркетинг / SMM
  | 'design'        // Дизайн / Креатив
  | 'development'   // Разработка / IT-услуги
  | 'custom'        // Другое

/**
 * Метод оплаты
 */
export type PaymentMethod =
  | 'stars'         // Telegram Stars (встроенная оплата)
  | 'ton'           // TON криптовалюта
  | 'usdt'          // USDT стейблкоин
  | 'robokassa'     // Robokassa (карты, банки)
  | 'bank'          // Прямой банковский перевод

/**
 * Сегмент целевой аудитории
 */
export type TargetSegment =
  // Бизнес-сегменты
  | 'entrepreneurs'     // Предприниматели
  | 'startups'          // Стартапы
  | 'small_business'    // Малый бизнес
  | 'corporations'      // Корпорации
  | 'freelancers'       // Фрилансеры
  // Ниши
  | 'bloggers'          // Блогеры
  | 'fitness_coaches'   // Фитнес-тренеры
  | 'life_coaches'      // Коучи
  | 'marketers'         // Маркетологи
  | 'developers'        // Разработчики
  | 'designers'         // Дизайнеры
  // Задачи
  | 'lead_generation'   // Ищут клиентов
  | 'scaling'           // Масштабируют бизнес
  | 'automation'        // Автоматизируют продажи
  | 'product_launch'    // Запускают продукт
  // Кастомный вариант
  | 'custom'            // Другое

/**
 * Уровень тона (1-3)
 */
export type ToneLevel = 1 | 2 | 3

/**
 * Настройки тона
 */
export interface ToneSettings {
  formality: ToneLevel // 1=неформально, 2=нейтрально, 3=формально
  emotion: ToneLevel   // 1=сдержанно, 2=умеренно, 3=эмоционально
  length: ToneLevel    // 1=коротко, 2=средне, 3=развёрнуто
}

/**
 * Пример диалога
 */
export interface DialogExample {
  user: string
  agent: string
}

/**
 * Скрипты продаж
 */
export interface SalesScripts {
  greeting: string              // Приветствие нового клиента
  valueProposition: string      // Ценностное предложение
  objections: {
    tooExpensive: string        // Возражение "Дорого"
    needToThink: string         // Возражение "Подумаю"
    notSure: string             // Возражение "Не уверен"
  }
  closing: string               // Закрытие сделки
}

/**
 * Триггерные слова
 */
export interface Triggers {
  serviceRequests: string[]     // Запросы на услуги
  painPoints: string[]          // Болевые точки
  readinessToBuy: string[]      // Готовность к покупке
}

/**
 * Данные Sales Agent в процессе заполнения
 */
export interface SalesAgentData {
  // === БАЗОВАЯ ИНФОРМАЦИЯ ===
  name?: string
  username?: string

  // === УСЛУГА ===
  service: {
    name?: string
    description?: string
    type?: ServiceType
  }

  // === ЦЕНООБРАЗОВАНИЕ ===
  pricing: {
    monthlyPrice?: number
    currency?: 'USD' | 'RUB' | 'EUR'
    paymentMethods: PaymentMethod[]
  }

  // === ЦЕЛЕВАЯ АУДИТОРИЯ ===
  targetAudience: {
    segments: TargetSegment[]
    customDescription?: string
  }

  // === ТРИГГЕРНЫЕ СЛОВА ===
  triggers: Triggers

  // === СКРИПТЫ ПРОДАЖ ===
  salesScripts: SalesScripts

  // === СТИЛЬ ОБЩЕНИЯ ===
  tone?: ToneSettings

  // === ПРИМЕРЫ ДИАЛОГОВ ===
  messageExamples: DialogExample[]

  // === АВТОГЕНЕРИРУЕМЫЕ ПОЛЯ ===
  bio: string[]
  adjectives: string[]
  topics: string[]
}

/**
 * Сессия конфигурации Sales Agent
 */
export interface SalesSession {
  chatId: string
  userId: string
  step: SalesAgentStep
  data: SalesAgentData
  createdAt: number
  updatedAt: number
}

/**
 * Memory ID для хранения сессии
 */
export const SALES_SESSION_KEY_PREFIX = 'sales-agent-config-session'

/**
 * Генерация ключа сессии для chatId
 */
export function getSessionKey(chatId: string): string {
  return `${SALES_SESSION_KEY_PREFIX}-${chatId}`
}

/**
 * Создание пустой сессии
 */
export function createEmptySession(chatId: string, userId: string): SalesSession {
  return {
    chatId,
    userId,
    step: SalesAgentStep.ONBOARDING,
    data: {
      service: {},
      pricing: {
        paymentMethods: [],
      },
      targetAudience: {
        segments: [],
      },
      triggers: {
        serviceRequests: [],
        painPoints: [],
        readinessToBuy: [],
      },
      salesScripts: {
        greeting: '',
        valueProposition: '',
        objections: {
          tooExpensive: '',
          needToThink: '',
          notSure: '',
        },
        closing: '',
      },
      messageExamples: [],
      bio: [],
      adjectives: [],
      topics: [],
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

/**
 * Доступные типы услуг
 */
export const SERVICE_TYPES: { id: ServiceType; name: string }[] = [
  { id: 'consulting', name: 'Консалтинг / Коучинг' },
  { id: 'saas', name: 'SaaS / Программное обеспечение' },
  { id: 'content', name: 'Контент / Образование' },
  { id: 'fitness', name: 'Фитнес / Здоровье' },
  { id: 'marketing', name: 'Маркетинг / SMM' },
  { id: 'design', name: 'Дизайн / Креатив' },
  { id: 'development', name: 'Разработка / IT-услуги' },
  { id: 'custom', name: 'Другое' },
]

/**
 * Доступные методы оплаты
 */
export const PAYMENT_METHODS: { id: PaymentMethod; name: string; description: string }[] = [
  { id: 'stars', name: 'Telegram Stars', description: 'Встроенная оплата в Telegram' },
  { id: 'ton', name: 'TON', description: 'Криптовалюта TON' },
  { id: 'usdt', name: 'USDT', description: 'Стейблкоин USDT' },
  { id: 'robokassa', name: 'Robokassa', description: 'Карты и банки через Robokassa' },
  { id: 'bank', name: 'Банковский перевод', description: 'Прямой банковский перевод' },
]

/**
 * Сегменты целевой аудитории
 */
export const TARGET_SEGMENTS: { id: TargetSegment; name: string; category: string }[] = [
  // Бизнес-сегменты
  { id: 'entrepreneurs', name: 'Предприниматели', category: 'business' },
  { id: 'startups', name: 'Стартапы', category: 'business' },
  { id: 'small_business', name: 'Малый бизнес', category: 'business' },
  { id: 'corporations', name: 'Корпорации', category: 'business' },
  { id: 'freelancers', name: 'Фрилансеры', category: 'business' },
  // Ниши
  { id: 'bloggers', name: 'Блогеры', category: 'niche' },
  { id: 'fitness_coaches', name: 'Фитнес-тренеры', category: 'niche' },
  { id: 'life_coaches', name: 'Коучи', category: 'niche' },
  { id: 'marketers', name: 'Маркетологи', category: 'niche' },
  { id: 'developers', name: 'Разработчики', category: 'niche' },
  { id: 'designers', name: 'Дизайнеры', category: 'niche' },
  // Задачи
  { id: 'lead_generation', name: 'Ищут клиентов', category: 'task' },
  { id: 'scaling', name: 'Масштабируют бизнес', category: 'task' },
  { id: 'automation', name: 'Автоматизируют продажи', category: 'task' },
  { id: 'product_launch', name: 'Запускают продукт', category: 'task' },
  // Кастомный
  { id: 'custom', name: 'Другое', category: 'custom' },
]

/**
 * Валюты
 */
export const CURRENCIES = ['USD', 'RUB', 'EUR'] as const

/**
 * Базовые плагины (добавляются автоматически)
 */
export const BASE_PLUGINS = [
  '@elizaos/plugin-bootstrap',
  '@elizaos/plugin-sql',
  '@elizaos/plugin-openrouter',
  '@elizaos/plugin-telegram',
  'plugin-telegram-craft', // Для платежей Stars/Crypto
] as const
