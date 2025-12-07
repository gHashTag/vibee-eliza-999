/**
 * KOLS Plugin - Настройки проактивного обучения
 *
 * Конфигурация интервалов, LLM параметров и поведения
 * проактивных обучающих сообщений.
 */

/**
 * Конфигурация интервалов проактивного обучения
 */
export const PROACTIVE_TIMING = {
  /**
   * Минимальный интервал между сообщениями (в минутах)
   */
  INTERVAL_MIN_MINUTES: 60,

  /**
   * Максимальный интервал между сообщениями (в минутах)
   */
  INTERVAL_MAX_MINUTES: 90,

  /**
   * Начальная задержка после старта (в минутах)
   */
  INITIAL_DELAY_MINUTES: 5
} as const;

/**
 * Конфигурация LLM для генерации обучающих сообщений
 */
export const PROACTIVE_LLM = {
  /**
   * Модель для генерации текста
   */
  MODEL: 'TEXT_SMALL',

  /**
   * Максимальное количество токенов в ответе
   * 1000 токенов ≈ 700-800 символов (достаточно для полных ответов)
   */
  MAX_TOKENS: 1000,

  /**
   * Температура генерации (0.0 - 1.0)
   * Выше = более креативно, ниже = более предсказуемо
   */
  TEMPERATURE: 0.8
} as const;

/**
 * Типы контента для проактивного обучения
 */
export const CONTENT_TYPES = [
  'concept',    // Концепции и определения
  'tip',        // Практические советы
  'example',    // Примеры кода
  'question',   // Вопросы для размышления
  'exercise'    // Упражнения
] as const;

export type ContentType = typeof CONTENT_TYPES[number];

/**
 * Конфигурация сообщений
 */
export const PROACTIVE_MESSAGE = {
  /**
   * Максимальная длина сообщения в символах
   */
  MAX_LENGTH: 1000,

  /**
   * Минимальная длина для отправки
   */
  MIN_LENGTH: 50,

  /**
   * Добавлять хэштеги в конец сообщения
   */
  ADD_HASHTAGS: true,

  /**
   * Стандартные хэштеги
   */
  HASHTAGS: ['#VibeCoding', '#ElizaOS', '#AIAgent']
} as const;

/**
 * Полная конфигурация проактивного обучения
 */
export const PROACTIVE_CONFIG = {
  timing: PROACTIVE_TIMING,
  llm: PROACTIVE_LLM,
  contentTypes: CONTENT_TYPES,
  message: PROACTIVE_MESSAGE
} as const;

/**
 * Генерирует случайный интервал между сообщениями (в миллисекундах)
 */
export function getRandomInterval(): number {
  const { INTERVAL_MIN_MINUTES, INTERVAL_MAX_MINUTES } = PROACTIVE_TIMING;
  const minMs = INTERVAL_MIN_MINUTES * 60 * 1000;
  const maxMs = INTERVAL_MAX_MINUTES * 60 * 1000;
  return Math.floor(Math.random() * (maxMs - minMs)) + minMs;
}

/**
 * Возвращает случайный тип контента
 */
export function getRandomContentType(): ContentType {
  const index = Math.floor(Math.random() * CONTENT_TYPES.length);
  return CONTENT_TYPES[index];
}
