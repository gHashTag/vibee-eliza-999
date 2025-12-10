// @ts-nocheck
/**
 * Configurator Service
 *
 * State machine для пошаговой конфигурации Character
 */

import type { IAgentRuntime } from '@elizaos/core'
import {
  ConfigStep,
  type ConfigSession,
  type AgentArchetype,
  type ToneLevel,
  createEmptySession,
  getSessionKey,
  AVAILABLE_MODELS,
  AVAILABLE_TEMPERATURES,
  PLATFORM_PLUGINS,
} from '../types/session.types.ts'
import { QUESTIONS, VALIDATION_ERRORS, PROGRESS_MESSAGES } from '../templates/questions.ts'
import { buildCharacter, generatePreview, generateInstructions, exportCharacterJson } from '../utils/characterBuilder.ts'

/**
 * Результат обработки сообщения
 */
interface ProcessResult {
  response: string
  nextStep?: ConfigStep
  character?: ReturnType<typeof buildCharacter>
  characterJson?: string
}

/**
 * In-memory хранилище сессий (для MVP)
 * В продакшене можно заменить на ElizaOS Memory API
 */
const sessions = new Map<string, ConfigSession>()

/**
 * Configurator Service
 */
export class ConfiguratorService {
  static serviceType = 'configurator'
  capabilityDescription = 'Character configurator wizard'

  private runtime: IAgentRuntime | null = null

  async initialize(runtime: IAgentRuntime): Promise<void> {
    this.runtime = runtime
    console.log('[ConfiguratorService] Initialized')
  }

  async start(): Promise<void> {
    console.log('[ConfiguratorService] Started')
  }

  async stop(): Promise<void> {
    console.log('[ConfiguratorService] Stopped')
  }

  /**
   * Получение или создание сессии
   */
  getSession(chatId: string, userId: string): ConfigSession {
    const key = getSessionKey(chatId)
    let session = sessions.get(key)

    if (!session) {
      session = createEmptySession(chatId, userId)
      sessions.set(key, session)
    }

    return session
  }

  /**
   * Сохранение сессии
   */
  saveSession(session: ConfigSession): void {
    const key = getSessionKey(session.chatId)
    session.updatedAt = Date.now()
    sessions.set(key, session)
  }

  /**
   * Удаление сессии (restart)
   */
  deleteSession(chatId: string): void {
    const key = getSessionKey(chatId)
    sessions.delete(key)
  }

  /**
   * Получение существующей сессии БЕЗ создания новой
   * Возвращает null если сессии нет
   */
  getExistingSession(chatId: string): ConfigSession | null {
    const key = getSessionKey(chatId)
    return sessions.get(key) || null
  }

  /**
   * Получение текущего вопроса
   */
  getCurrentQuestion(session: ConfigSession): string {
    const template = QUESTIONS[session.step]

    if (session.step === ConfigStep.PREVIEW) {
      const preview = generatePreview(session.data)
      return template.replace('{preview}', preview)
    }

    if (session.step === ConfigStep.DONE) {
      const instructions = generateInstructions(session.data.name || 'agent')
      return template.replace('{instructions}', instructions)
    }

    return template
  }

  /**
   * Обработка входящего сообщения
   */
  async processMessage(chatId: string, userId: string, text: string): Promise<ProcessResult> {
    const session = this.getSession(chatId, userId)
    const input = text.trim()

    // Обработка команд preview
    if (session.step === ConfigStep.PREVIEW) {
      return this.handlePreviewCommand(session, input)
    }

    // Обработка по текущему шагу
    const result = await this.processStep(session, input)
    this.saveSession(session)

    return result
  }

  /**
   * Обработка шага конфигурации
   */
  private async processStep(session: ConfigSession, input: string): Promise<ProcessResult> {
    switch (session.step) {
      case ConfigStep.ONBOARDING:
        return this.handleOnboarding(session, input)

      case ConfigStep.NAME:
        return this.handleName(session, input)

      case ConfigStep.USERNAME:
        return this.handleUsername(session, input)

      case ConfigStep.BIO_ROLE:
        return this.handleBioRole(session, input)

      case ConfigStep.BIO_EXPERTISE:
        return this.handleBioExpertise(session, input)

      case ConfigStep.BIO_AUDIENCE:
        return this.handleBioAudience(session, input)

      case ConfigStep.BIO_UNIQUE:
        return this.handleBioUnique(session, input)

      case ConfigStep.TONE_FORMALITY:
        return this.handleToneFormality(session, input)

      case ConfigStep.TONE_EMOTION:
        return this.handleToneEmotion(session, input)

      case ConfigStep.TONE_LENGTH:
        return this.handleToneLength(session, input)

      case ConfigStep.ADJECTIVES:
        return this.handleAdjectives(session, input)

      case ConfigStep.TOPICS:
        return this.handleTopics(session, input)

      case ConfigStep.EXAMPLE_GREETING_USER:
        return this.handleExampleGreetingUser(session, input)

      case ConfigStep.EXAMPLE_GREETING_AGENT:
        return this.handleExampleGreetingAgent(session, input)

      case ConfigStep.EXAMPLE_QUESTION_USER:
        return this.handleExampleQuestionUser(session, input)

      case ConfigStep.EXAMPLE_QUESTION_AGENT:
        return this.handleExampleQuestionAgent(session, input)

      case ConfigStep.KNOWLEDGE:
        return this.handleKnowledge(session, input)

      case ConfigStep.PLUGINS:
        return this.handlePlugins(session, input)

      case ConfigStep.SETTINGS_MODEL:
        return this.handleSettingsModel(session, input)

      case ConfigStep.SETTINGS_TEMPERATURE:
        return this.handleSettingsTemperature(session, input)

      default:
        return { response: QUESTIONS[session.step] }
    }
  }

  // === Handlers ===

  private handleOnboarding(session: ConfigSession, input: string): ProcessResult {
    const choice = parseInt(input, 10)

    if (choice >= 1 && choice <= 4) {
      const archetypes: AgentArchetype[] = ['expert', 'assistant', 'companion', 'creator']
      session.data.archetype = archetypes[choice - 1]
    } else if (choice === 5 || isNaN(choice)) {
      session.data.archetype = 'custom'
      session.data.archetypeCustom = input
    } else {
      return { response: VALIDATION_ERRORS.invalidChoice }
    }

    session.step = ConfigStep.NAME
    return { response: `${PROGRESS_MESSAGES.saved}\n\n${QUESTIONS[ConfigStep.NAME]}` }
  }

  private handleName(session: ConfigSession, input: string): ProcessResult {
    if (input.length < 2) {
      return { response: VALIDATION_ERRORS.nameTooShort }
    }
    if (input.length > 50) {
      return { response: VALIDATION_ERRORS.nameTooLong }
    }
    if (!/^[\w\sа-яА-ЯёЁ-]+$/u.test(input)) {
      return { response: VALIDATION_ERRORS.nameInvalidChars }
    }

    session.data.name = input
    session.step = ConfigStep.USERNAME
    return { response: `${PROGRESS_MESSAGES.saved}\n\n${QUESTIONS[ConfigStep.USERNAME]}` }
  }

  private handleUsername(session: ConfigSession, input: string): ProcessResult {
    if (input.toLowerCase() !== 'пропустить') {
      session.data.username = input.replace(/^@/, '')
    }

    session.step = ConfigStep.BIO_ROLE
    return { response: `${PROGRESS_MESSAGES.saved}\n\n${QUESTIONS[ConfigStep.BIO_ROLE]}` }
  }

  private handleBioRole(session: ConfigSession, input: string): ProcessResult {
    session.data.bio.push(input)
    session.step = ConfigStep.BIO_EXPERTISE
    return { response: `${PROGRESS_MESSAGES.saved}\n\n${QUESTIONS[ConfigStep.BIO_EXPERTISE]}` }
  }

  private handleBioExpertise(session: ConfigSession, input: string): ProcessResult {
    session.data.bio.push(`Экспертиза: ${input}`)
    session.step = ConfigStep.BIO_AUDIENCE
    return { response: `${PROGRESS_MESSAGES.saved}\n\n${QUESTIONS[ConfigStep.BIO_AUDIENCE]}` }
  }

  private handleBioAudience(session: ConfigSession, input: string): ProcessResult {
    session.data.bio.push(`Аудитория: ${input}`)
    session.step = ConfigStep.BIO_UNIQUE
    return { response: `${PROGRESS_MESSAGES.saved}\n\n${QUESTIONS[ConfigStep.BIO_UNIQUE]}` }
  }

  private handleBioUnique(session: ConfigSession, input: string): ProcessResult {
    session.data.bio.push(input)
    session.step = ConfigStep.TONE_FORMALITY
    return { response: `${PROGRESS_MESSAGES.saved}\n\n${QUESTIONS[ConfigStep.TONE_FORMALITY]}` }
  }

  private handleToneFormality(session: ConfigSession, input: string): ProcessResult {
    const choice = parseInt(input, 10) as ToneLevel
    if (choice < 1 || choice > 3) {
      return { response: VALIDATION_ERRORS.invalidChoice }
    }

    session.data.tone = session.data.tone || { formality: 2, emotion: 2, length: 2 }
    session.data.tone.formality = choice
    session.step = ConfigStep.TONE_EMOTION
    return { response: `${PROGRESS_MESSAGES.saved}\n\n${QUESTIONS[ConfigStep.TONE_EMOTION]}` }
  }

  private handleToneEmotion(session: ConfigSession, input: string): ProcessResult {
    const choice = parseInt(input, 10) as ToneLevel
    if (choice < 1 || choice > 3) {
      return { response: VALIDATION_ERRORS.invalidChoice }
    }

    session.data.tone!.emotion = choice
    session.step = ConfigStep.TONE_LENGTH
    return { response: `${PROGRESS_MESSAGES.saved}\n\n${QUESTIONS[ConfigStep.TONE_LENGTH]}` }
  }

  private handleToneLength(session: ConfigSession, input: string): ProcessResult {
    const choice = parseInt(input, 10) as ToneLevel
    if (choice < 1 || choice > 3) {
      return { response: VALIDATION_ERRORS.invalidChoice }
    }

    session.data.tone!.length = choice
    session.step = ConfigStep.ADJECTIVES
    return { response: `${PROGRESS_MESSAGES.saved}\n\n${QUESTIONS[ConfigStep.ADJECTIVES]}` }
  }

  private handleAdjectives(session: ConfigSession, input: string): ProcessResult {
    const adjectives = input.split(',').map((a) => a.trim()).filter(Boolean)

    if (adjectives.length < 3) {
      return { response: VALIDATION_ERRORS.tooFewAdjectives }
    }
    if (adjectives.length > 7) {
      return { response: VALIDATION_ERRORS.tooManyAdjectives }
    }

    session.data.adjectives = adjectives
    session.step = ConfigStep.TOPICS
    return { response: `${PROGRESS_MESSAGES.saved}\n\n${QUESTIONS[ConfigStep.TOPICS]}` }
  }

  private handleTopics(session: ConfigSession, input: string): ProcessResult {
    const topics = input.split(',').map((t) => t.trim()).filter(Boolean)

    if (topics.length < 1) {
      return { response: VALIDATION_ERRORS.tooFewTopics }
    }

    session.data.topics = topics
    session.step = ConfigStep.EXAMPLE_GREETING_USER
    return { response: `${PROGRESS_MESSAGES.saved}\n\n${QUESTIONS[ConfigStep.EXAMPLE_GREETING_USER]}` }
  }

  private handleExampleGreetingUser(session: ConfigSession, input: string): ProcessResult {
    // Сохраняем временно в первый пример
    if (session.data.messageExamples.length === 0) {
      session.data.messageExamples.push({ user: input, agent: '' })
    } else {
      session.data.messageExamples[0].user = input
    }

    session.step = ConfigStep.EXAMPLE_GREETING_AGENT
    return { response: `${PROGRESS_MESSAGES.saved}\n\n${QUESTIONS[ConfigStep.EXAMPLE_GREETING_AGENT]}` }
  }

  private handleExampleGreetingAgent(session: ConfigSession, input: string): ProcessResult {
    session.data.messageExamples[0].agent = input
    session.step = ConfigStep.EXAMPLE_QUESTION_USER
    return { response: `${PROGRESS_MESSAGES.saved}\n\n${QUESTIONS[ConfigStep.EXAMPLE_QUESTION_USER]}` }
  }

  private handleExampleQuestionUser(session: ConfigSession, input: string): ProcessResult {
    session.data.messageExamples.push({ user: input, agent: '' })
    session.step = ConfigStep.EXAMPLE_QUESTION_AGENT
    return { response: `${PROGRESS_MESSAGES.saved}\n\n${QUESTIONS[ConfigStep.EXAMPLE_QUESTION_AGENT]}` }
  }

  private handleExampleQuestionAgent(session: ConfigSession, input: string): ProcessResult {
    session.data.messageExamples[1].agent = input
    session.step = ConfigStep.KNOWLEDGE
    return { response: `${PROGRESS_MESSAGES.saved}\n\n${QUESTIONS[ConfigStep.KNOWLEDGE]}` }
  }

  private handleKnowledge(session: ConfigSession, input: string): ProcessResult {
    if (input.toLowerCase() !== 'пропустить') {
      const knowledge = input.split(',').map((k) => k.trim()).filter(Boolean)
      session.data.knowledge = knowledge
    }

    session.step = ConfigStep.PLUGINS
    return { response: `${PROGRESS_MESSAGES.saved}\n\n${QUESTIONS[ConfigStep.PLUGINS]}` }
  }

  private handlePlugins(session: ConfigSession, input: string): ProcessResult {
    const platforms = input.toLowerCase().split(',').map((p) => p.trim()).filter(Boolean)
    const validPlatforms = Object.keys(PLATFORM_PLUGINS)
    const invalidPlatforms = platforms.filter((p) => !validPlatforms.includes(p))

    if (invalidPlatforms.length > 0) {
      return { response: `${VALIDATION_ERRORS.invalidPlatform}\nНеизвестные: ${invalidPlatforms.join(', ')}` }
    }

    session.data.plugins = platforms
    session.step = ConfigStep.SETTINGS_MODEL
    return { response: `${PROGRESS_MESSAGES.saved}\n\n${QUESTIONS[ConfigStep.SETTINGS_MODEL]}` }
  }

  private handleSettingsModel(session: ConfigSession, input: string): ProcessResult {
    const choice = parseInt(input, 10)
    if (choice < 1 || choice > AVAILABLE_MODELS.length) {
      return { response: VALIDATION_ERRORS.invalidChoice }
    }

    const model = AVAILABLE_MODELS[choice - 1]
    session.data.settings = {
      modelProvider: model.provider,
      model: model.name,
      temperature: 0.5,
    }

    session.step = ConfigStep.SETTINGS_TEMPERATURE
    return { response: `${PROGRESS_MESSAGES.saved}\n\n${QUESTIONS[ConfigStep.SETTINGS_TEMPERATURE]}` }
  }

  private handleSettingsTemperature(session: ConfigSession, input: string): ProcessResult {
    const choice = parseInt(input, 10)
    if (choice < 1 || choice > AVAILABLE_TEMPERATURES.length) {
      return { response: VALIDATION_ERRORS.invalidChoice }
    }

    session.data.settings!.temperature = AVAILABLE_TEMPERATURES[choice - 1].value
    session.step = ConfigStep.PREVIEW

    const preview = generatePreview(session.data)
    return { response: QUESTIONS[ConfigStep.PREVIEW].replace('{preview}', preview) }
  }

  private handlePreviewCommand(session: ConfigSession, input: string): ProcessResult {
    const command = input.toLowerCase()

    switch (command) {
      case 'готово': {
        const character = buildCharacter(session.data)
        const characterJson = exportCharacterJson(character)
        const instructions = generateInstructions(session.data.name || 'agent')

        session.step = ConfigStep.DONE
        this.saveSession(session)

        return {
          response: `${PROGRESS_MESSAGES.generating}\n\n${QUESTIONS[ConfigStep.DONE].replace('{instructions}', instructions)}`,
          character,
          characterJson,
        }
      }

      case 'имя':
        session.step = ConfigStep.NAME
        this.saveSession(session)
        return { response: QUESTIONS[ConfigStep.NAME] }

      case 'bio':
        session.data.bio = []
        session.step = ConfigStep.BIO_ROLE
        this.saveSession(session)
        return { response: QUESTIONS[ConfigStep.BIO_ROLE] }

      case 'тон':
        session.step = ConfigStep.TONE_FORMALITY
        this.saveSession(session)
        return { response: QUESTIONS[ConfigStep.TONE_FORMALITY] }

      case 'заново':
        this.deleteSession(session.chatId)
        const newSession = this.getSession(session.chatId, session.userId)
        return { response: QUESTIONS[ConfigStep.ONBOARDING] }

      default:
        return { response: 'Неизвестная команда. Напиши: готово, имя, bio, тон или заново' }
    }
  }

  /**
   * Получение статуса
   */
  getStatus(chatId: string): string {
    const key = getSessionKey(chatId)
    const session = sessions.get(key)

    if (!session) {
      return 'Сессия не найдена. Напиши /start чтобы начать.'
    }

    const stepNames: Record<ConfigStep, string> = {
      [ConfigStep.ONBOARDING]: 'Выбор типа агента',
      [ConfigStep.NAME]: 'Имя агента',
      [ConfigStep.USERNAME]: 'Username',
      [ConfigStep.BIO_ROLE]: 'Bio: роль',
      [ConfigStep.BIO_EXPERTISE]: 'Bio: экспертиза',
      [ConfigStep.BIO_AUDIENCE]: 'Bio: аудитория',
      [ConfigStep.BIO_UNIQUE]: 'Bio: уникальность',
      [ConfigStep.TONE_FORMALITY]: 'Тон: формальность',
      [ConfigStep.TONE_EMOTION]: 'Тон: эмоциональность',
      [ConfigStep.TONE_LENGTH]: 'Тон: длина ответов',
      [ConfigStep.ADJECTIVES]: 'Черты характера',
      [ConfigStep.TOPICS]: 'Темы',
      [ConfigStep.EXAMPLE_GREETING_USER]: 'Пример: приветствие (user)',
      [ConfigStep.EXAMPLE_GREETING_AGENT]: 'Пример: приветствие (agent)',
      [ConfigStep.EXAMPLE_QUESTION_USER]: 'Пример: вопрос (user)',
      [ConfigStep.EXAMPLE_QUESTION_AGENT]: 'Пример: вопрос (agent)',
      [ConfigStep.KNOWLEDGE]: 'Знания',
      [ConfigStep.PLUGINS]: 'Платформы',
      [ConfigStep.SETTINGS_MODEL]: 'Настройки: модель',
      [ConfigStep.SETTINGS_TEMPERATURE]: 'Настройки: температура',
      [ConfigStep.PREVIEW]: 'Предпросмотр',
      [ConfigStep.DONE]: 'Готово',
    }

    return `Текущий шаг: ${stepNames[session.step]}\n\nИмя: ${session.data.name || '(не указано)'}`
  }
}

// Singleton instance
export const configuratorService = new ConfiguratorService()
