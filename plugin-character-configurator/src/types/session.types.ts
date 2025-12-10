/**
 * Character Configurator - Session Types
 *
 * Типы для сессии конфигурации Character через пошаговый диалог
 */

/**
 * Шаги конфигурации
 */
export enum ConfigStep {
  ONBOARDING = 'onboarding',
  NAME = 'name',
  USERNAME = 'username',
  BIO_ROLE = 'bio_role',
  BIO_EXPERTISE = 'bio_expertise',
  BIO_AUDIENCE = 'bio_audience',
  BIO_UNIQUE = 'bio_unique',
  TONE_FORMALITY = 'tone_formality',
  TONE_EMOTION = 'tone_emotion',
  TONE_LENGTH = 'tone_length',
  ADJECTIVES = 'adjectives',
  TOPICS = 'topics',
  EXAMPLE_GREETING_USER = 'example_greeting_user',
  EXAMPLE_GREETING_AGENT = 'example_greeting_agent',
  EXAMPLE_QUESTION_USER = 'example_question_user',
  EXAMPLE_QUESTION_AGENT = 'example_question_agent',
  KNOWLEDGE = 'knowledge',
  PLUGINS = 'plugins',
  SETTINGS_MODEL = 'settings_model',
  SETTINGS_TEMPERATURE = 'settings_temperature',
  PREVIEW = 'preview',
  DONE = 'done',
}

/**
 * Архетип агента
 */
export type AgentArchetype =
  | 'expert'
  | 'assistant'
  | 'companion'
  | 'creator'
  | 'custom'

/**
 * Уровень тона (1-3)
 */
export type ToneLevel = 1 | 2 | 3

/**
 * Настройки тона
 */
export interface ToneSettings {
  formality: ToneLevel // 1=неформально, 2=нейтрально, 3=формально
  emotion: ToneLevel // 1=сдержанно, 2=умеренно, 3=эмоционально
  length: ToneLevel // 1=коротко, 2=средне, 3=развёрнуто
}

/**
 * Пример диалога
 */
export interface DialogExample {
  user: string
  agent: string
}

/**
 * Настройки модели
 */
export interface ModelSettings {
  modelProvider: string
  model: string
  temperature: number
}

/**
 * Данные Character в процессе заполнения
 */
export interface CharacterData {
  archetype?: AgentArchetype
  archetypeCustom?: string
  name?: string
  username?: string
  bio: string[]
  tone?: ToneSettings
  adjectives: string[]
  topics: string[]
  messageExamples: DialogExample[]
  knowledge: string[]
  plugins: string[]
  settings?: ModelSettings
}

/**
 * Сессия конфигурации
 */
export interface ConfigSession {
  chatId: string
  userId: string
  step: ConfigStep
  data: CharacterData
  createdAt: number
  updatedAt: number
}

/**
 * Memory ID для хранения сессии
 */
export const CONFIG_SESSION_KEY_PREFIX = 'character-config-session'

/**
 * Генерация ключа сессии для chatId
 */
export function getSessionKey(chatId: string): string {
  return `${CONFIG_SESSION_KEY_PREFIX}-${chatId}`
}

/**
 * Создание пустой сессии
 */
export function createEmptySession(chatId: string, userId: string): ConfigSession {
  return {
    chatId,
    userId,
    step: ConfigStep.ONBOARDING,
    data: {
      bio: [],
      adjectives: [],
      topics: [],
      messageExamples: [],
      knowledge: [],
      plugins: [],
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

/**
 * Модели для выбора
 */
export const AVAILABLE_MODELS = [
  { id: 'xai/grok-beta', name: 'grok-4.1-fast', provider: 'openrouter' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'claude-3.5-sonnet', provider: 'openrouter' },
  { id: 'openai/gpt-4o', name: 'gpt-4o', provider: 'openrouter' },
] as const

/**
 * Температуры для выбора
 */
export const AVAILABLE_TEMPERATURES = [
  { value: 0.3, label: 'низкая' },
  { value: 0.5, label: 'средняя' },
  { value: 0.7, label: 'высокая' },
] as const

/**
 * Базовые плагины (добавляются автоматически)
 */
export const BASE_PLUGINS = [
  '@elizaos/plugin-bootstrap',
  '@elizaos/plugin-sql',
  '@elizaos/plugin-openrouter',
] as const

/**
 * Доступные платформенные плагины
 */
export const PLATFORM_PLUGINS = {
  telegram: '@elizaos/plugin-telegram',
  discord: '@elizaos/plugin-discord',
  twitter: '@elizaos/plugin-twitter',
  web: '@elizaos/plugin-direct',
} as const
