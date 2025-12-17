// @ts-nocheck
/**
 * Sales Configurator Service
 *
 * State machine для пошаговой конфигурации Sales Agent (27 шагов)
 */

import type { IAgentRuntime } from '@elizaos/core'
import {
  SalesAgentStep,
  type SalesSession,
  type ServiceType,
  type PaymentMethod,
  type TargetSegment,
  type ToneLevel,
  createEmptySession,
  getSessionKey,
  SERVICE_TYPES,
  PAYMENT_METHODS,
  TARGET_SEGMENTS,
  CURRENCIES,
} from '../types/session.types.ts'
import { SALES_QUESTIONS, SALES_VALIDATION_ERRORS, SALES_PROGRESS_MESSAGES } from '../templates/questions.ts'
import { buildSalesCharacter, generatePreview, generateInstructions, exportCharacterJson } from '../utils/salesCharacterBuilder.ts'

/**
 * Результат обработки сообщения
 */
interface ProcessResult {
  response: string
  nextStep?: SalesAgentStep
  character?: ReturnType<typeof buildSalesCharacter>
  characterJson?: string
}

/**
 * In-memory хранилище сессий
 */
const sessions = new Map<string, SalesSession>()

/**
 * Sales Configurator Service
 */
export class SalesConfiguratorService {
  static serviceType = 'sales-configurator'
  capabilityDescription = 'Sales Agent configurator wizard'

  private runtime: IAgentRuntime | null = null

  async initialize(runtime: IAgentRuntime): Promise<void> {
    this.runtime = runtime
    console.log('[SalesConfiguratorService] Initialized')
  }

  async start(): Promise<void> {
    console.log('[SalesConfiguratorService] Started')
  }

  async stop(): Promise<void> {
    console.log('[SalesConfiguratorService] Stopped')
  }

  /**
   * Получение или создание сессии
   */
  getSession(chatId: string, userId: string): SalesSession {
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
  saveSession(session: SalesSession): void {
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
   */
  getExistingSession(chatId: string): SalesSession | null {
    const key = getSessionKey(chatId)
    return sessions.get(key) || null
  }

  /**
   * Получение текущего вопроса
   */
  getCurrentQuestion(session: SalesSession): string {
    const template = SALES_QUESTIONS[session.step]

    if (session.step === SalesAgentStep.PREVIEW) {
      const preview = generatePreview(session.data)
      return template.replace('{preview}', preview)
    }

    if (session.step === SalesAgentStep.DONE) {
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
    if (session.step === SalesAgentStep.PREVIEW) {
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
  private async processStep(session: SalesSession, input: string): Promise<ProcessResult> {
    switch (session.step) {
      // === ОНБОРДИНГ ===
      case SalesAgentStep.ONBOARDING:
        return this.handleOnboarding(session, input)

      // === БАЗОВАЯ ИНФОРМАЦИЯ ===
      case SalesAgentStep.NAME:
        return this.handleName(session, input)
      case SalesAgentStep.USERNAME:
        return this.handleUsername(session, input)
      case SalesAgentStep.SERVICE_NAME:
        return this.handleServiceName(session, input)
      case SalesAgentStep.SERVICE_DESCRIPTION:
        return this.handleServiceDescription(session, input)

      // === ЦЕНООБРАЗОВАНИЕ ===
      case SalesAgentStep.PRICE_MONTHLY:
        return this.handlePriceMonthly(session, input)
      case SalesAgentStep.PRICE_CURRENCY:
        return this.handlePriceCurrency(session, input)
      case SalesAgentStep.PAYMENT_METHODS:
        return this.handlePaymentMethods(session, input)

      // === ЦЕЛЕВАЯ АУДИТОРИЯ ===
      case SalesAgentStep.TARGET_AUDIENCE_SEGMENTS:
        return this.handleTargetAudienceSegments(session, input)
      case SalesAgentStep.TARGET_AUDIENCE_CUSTOM:
        return this.handleTargetAudienceCustom(session, input)

      // === ТРИГГЕРНЫЕ СЛОВА ===
      case SalesAgentStep.TRIGGERS_SERVICE:
        return this.handleTriggersService(session, input)
      case SalesAgentStep.TRIGGERS_PAIN:
        return this.handleTriggersPain(session, input)
      case SalesAgentStep.TRIGGERS_READINESS:
        return this.handleTriggersReadiness(session, input)

      // === СКРИПТЫ ПРОДАЖ ===
      case SalesAgentStep.SCRIPT_GREETING:
        return this.handleScriptGreeting(session, input)
      case SalesAgentStep.SCRIPT_VALUE_PROP:
        return this.handleScriptValueProp(session, input)
      case SalesAgentStep.SCRIPT_OBJECTION_1:
        return this.handleScriptObjection1(session, input)
      case SalesAgentStep.SCRIPT_OBJECTION_2:
        return this.handleScriptObjection2(session, input)
      case SalesAgentStep.SCRIPT_OBJECTION_3:
        return this.handleScriptObjection3(session, input)
      case SalesAgentStep.SCRIPT_CLOSING:
        return this.handleScriptClosing(session, input)

      // === СТИЛЬ ОБЩЕНИЯ ===
      case SalesAgentStep.TONE_FORMALITY:
        return this.handleToneFormality(session, input)
      case SalesAgentStep.TONE_EMOTION:
        return this.handleToneEmotion(session, input)
      case SalesAgentStep.TONE_LENGTH:
        return this.handleToneLength(session, input)

      // === ПРИМЕРЫ ДИАЛОГОВ ===
      case SalesAgentStep.EXAMPLE_FIRST_CONTACT_USER:
        return this.handleExampleFirstContactUser(session, input)
      case SalesAgentStep.EXAMPLE_FIRST_CONTACT_AGENT:
        return this.handleExampleFirstContactAgent(session, input)
      case SalesAgentStep.EXAMPLE_OBJECTION_USER:
        return this.handleExampleObjectionUser(session, input)
      case SalesAgentStep.EXAMPLE_OBJECTION_AGENT:
        return this.handleExampleObjectionAgent(session, input)

      default:
        return { response: SALES_QUESTIONS[session.step] }
    }
  }

  // === HANDLERS ===

  // --- ОНБОРДИНГ ---
  private handleOnboarding(session: SalesSession, input: string): ProcessResult {
    const choice = parseInt(input, 10)

    if (choice >= 1 && choice <= 7) {
      const types: ServiceType[] = ['consulting', 'saas', 'content', 'fitness', 'marketing', 'design', 'development']
      session.data.service.type = types[choice - 1]
    } else if (choice === 8 || isNaN(choice)) {
      session.data.service.type = 'custom'
    } else {
      return { response: SALES_VALIDATION_ERRORS.invalidChoice }
    }

    session.step = SalesAgentStep.NAME
    return { response: `${SALES_PROGRESS_MESSAGES.saved}\n\n${SALES_QUESTIONS[SalesAgentStep.NAME]}` }
  }

  // --- БАЗОВАЯ ИНФОРМАЦИЯ ---
  private handleName(session: SalesSession, input: string): ProcessResult {
    if (input.length < 2) {
      return { response: SALES_VALIDATION_ERRORS.nameTooShort }
    }
    if (input.length > 50) {
      return { response: SALES_VALIDATION_ERRORS.nameTooLong }
    }
    if (!/^[\w\sа-яА-ЯёЁ-]+$/u.test(input)) {
      return { response: SALES_VALIDATION_ERRORS.nameInvalidChars }
    }

    session.data.name = input
    session.step = SalesAgentStep.USERNAME
    return { response: `${SALES_PROGRESS_MESSAGES.saved}\n\n${SALES_QUESTIONS[SalesAgentStep.USERNAME]}` }
  }

  private handleUsername(session: SalesSession, input: string): ProcessResult {
    if (input.toLowerCase() !== 'пропустить') {
      session.data.username = input.replace(/^@/, '')
    }

    session.step = SalesAgentStep.SERVICE_NAME
    return { response: `${SALES_PROGRESS_MESSAGES.saved}\n\n${SALES_QUESTIONS[SalesAgentStep.SERVICE_NAME]}` }
  }

  private handleServiceName(session: SalesSession, input: string): ProcessResult {
    if (input.length < 3) {
      return { response: SALES_VALIDATION_ERRORS.serviceNameTooShort }
    }

    session.data.service.name = input
    session.step = SalesAgentStep.SERVICE_DESCRIPTION
    return { response: `${SALES_PROGRESS_MESSAGES.saved}\n\n${SALES_QUESTIONS[SalesAgentStep.SERVICE_DESCRIPTION]}` }
  }

  private handleServiceDescription(session: SalesSession, input: string): ProcessResult {
    if (input.length < 20) {
      return { response: SALES_VALIDATION_ERRORS.serviceDescriptionTooShort }
    }

    session.data.service.description = input
    session.step = SalesAgentStep.PRICE_MONTHLY
    return { response: `${SALES_PROGRESS_MESSAGES.saved}\n\n${SALES_QUESTIONS[SalesAgentStep.PRICE_MONTHLY]}` }
  }

  // --- ЦЕНООБРАЗОВАНИЕ ---
  private handlePriceMonthly(session: SalesSession, input: string): ProcessResult {
    const price = parseFloat(input.replace(',', '.'))

    if (isNaN(price) || price <= 0) {
      return { response: SALES_VALIDATION_ERRORS.invalidPrice }
    }
    if (price < 1) {
      return { response: SALES_VALIDATION_ERRORS.priceTooLow }
    }
    if (price > 1000000) {
      return { response: SALES_VALIDATION_ERRORS.priceTooHigh }
    }

    session.data.pricing.monthlyPrice = price
    session.step = SalesAgentStep.PRICE_CURRENCY
    return { response: `${SALES_PROGRESS_MESSAGES.saved}\n\n${SALES_QUESTIONS[SalesAgentStep.PRICE_CURRENCY]}` }
  }

  private handlePriceCurrency(session: SalesSession, input: string): ProcessResult {
    const choice = parseInt(input, 10)

    if (choice < 1 || choice > 3) {
      return { response: SALES_VALIDATION_ERRORS.invalidChoice }
    }

    session.data.pricing.currency = CURRENCIES[choice - 1] as 'USD' | 'RUB' | 'EUR'
    session.step = SalesAgentStep.PAYMENT_METHODS
    return { response: `${SALES_PROGRESS_MESSAGES.saved}\n\n${SALES_QUESTIONS[SalesAgentStep.PAYMENT_METHODS]}` }
  }

  private handlePaymentMethods(session: SalesSession, input: string): ProcessResult {
    const methods = input.toLowerCase().split(',').map(m => m.trim()).filter(Boolean)
    const validMethods: PaymentMethod[] = ['stars', 'ton', 'usdt', 'robokassa', 'bank']

    const invalidMethods = methods.filter(m => !validMethods.includes(m as PaymentMethod))
    if (invalidMethods.length > 0) {
      return { response: `${SALES_VALIDATION_ERRORS.invalidPaymentMethod}\nНеизвестные: ${invalidMethods.join(', ')}` }
    }

    if (methods.length === 0) {
      return { response: SALES_VALIDATION_ERRORS.noPaymentMethods }
    }

    session.data.pricing.paymentMethods = methods as PaymentMethod[]
    session.step = SalesAgentStep.TARGET_AUDIENCE_SEGMENTS
    return { response: `${SALES_PROGRESS_MESSAGES.saved}\n\n${SALES_QUESTIONS[SalesAgentStep.TARGET_AUDIENCE_SEGMENTS]}` }
  }

  // --- ЦЕЛЕВАЯ АУДИТОРИЯ ---
  private handleTargetAudienceSegments(session: SalesSession, input: string): ProcessResult {
    const choices = input.split(',').map(c => parseInt(c.trim(), 10)).filter(n => !isNaN(n))

    if (choices.length === 0) {
      return { response: SALES_VALIDATION_ERRORS.noAudienceSegments }
    }

    const invalidChoices = choices.filter(c => c < 1 || c > 16)
    if (invalidChoices.length > 0) {
      return { response: SALES_VALIDATION_ERRORS.invalidAudienceSegment }
    }

    const segmentIds: TargetSegment[] = [
      'entrepreneurs', 'startups', 'small_business', 'corporations', 'freelancers',
      'bloggers', 'fitness_coaches', 'life_coaches', 'marketers', 'developers', 'designers',
      'lead_generation', 'scaling', 'automation', 'product_launch', 'custom'
    ]

    session.data.targetAudience.segments = choices.map(c => segmentIds[c - 1])

    // Если выбрал "другое" (16), переходим к кастомному описанию
    if (choices.includes(16)) {
      session.step = SalesAgentStep.TARGET_AUDIENCE_CUSTOM
      return { response: `${SALES_PROGRESS_MESSAGES.saved}\n\n${SALES_QUESTIONS[SalesAgentStep.TARGET_AUDIENCE_CUSTOM]}` }
    }

    session.step = SalesAgentStep.TRIGGERS_SERVICE
    return { response: `${SALES_PROGRESS_MESSAGES.saved}\n\n${SALES_QUESTIONS[SalesAgentStep.TRIGGERS_SERVICE]}` }
  }

  private handleTargetAudienceCustom(session: SalesSession, input: string): ProcessResult {
    session.data.targetAudience.customDescription = input
    session.step = SalesAgentStep.TRIGGERS_SERVICE
    return { response: `${SALES_PROGRESS_MESSAGES.saved}\n\n${SALES_QUESTIONS[SalesAgentStep.TRIGGERS_SERVICE]}` }
  }

  // --- ТРИГГЕРНЫЕ СЛОВА ---
  private handleTriggersService(session: SalesSession, input: string): ProcessResult {
    const triggers = input.split(',').map(t => t.trim()).filter(Boolean)

    if (triggers.length < 3) {
      return { response: SALES_VALIDATION_ERRORS.tooFewTriggers }
    }
    if (triggers.length > 10) {
      return { response: SALES_VALIDATION_ERRORS.tooManyTriggers }
    }

    session.data.triggers.serviceRequests = triggers
    session.step = SalesAgentStep.TRIGGERS_PAIN
    return { response: `${SALES_PROGRESS_MESSAGES.saved}\n\n${SALES_QUESTIONS[SalesAgentStep.TRIGGERS_PAIN]}` }
  }

  private handleTriggersPain(session: SalesSession, input: string): ProcessResult {
    const triggers = input.split(',').map(t => t.trim()).filter(Boolean)

    if (triggers.length < 3) {
      return { response: SALES_VALIDATION_ERRORS.tooFewTriggers }
    }
    if (triggers.length > 10) {
      return { response: SALES_VALIDATION_ERRORS.tooManyTriggers }
    }

    session.data.triggers.painPoints = triggers
    session.step = SalesAgentStep.TRIGGERS_READINESS
    return { response: `${SALES_PROGRESS_MESSAGES.saved}\n\n${SALES_QUESTIONS[SalesAgentStep.TRIGGERS_READINESS]}` }
  }

  private handleTriggersReadiness(session: SalesSession, input: string): ProcessResult {
    const triggers = input.split(',').map(t => t.trim()).filter(Boolean)

    if (triggers.length < 3) {
      return { response: SALES_VALIDATION_ERRORS.tooFewTriggers }
    }
    if (triggers.length > 10) {
      return { response: SALES_VALIDATION_ERRORS.tooManyTriggers }
    }

    session.data.triggers.readinessToBuy = triggers
    session.step = SalesAgentStep.SCRIPT_GREETING
    return { response: `${SALES_PROGRESS_MESSAGES.saved}\n\n${SALES_QUESTIONS[SalesAgentStep.SCRIPT_GREETING]}` }
  }

  // --- СКРИПТЫ ПРОДАЖ ---
  private handleScriptGreeting(session: SalesSession, input: string): ProcessResult {
    if (input.length < 20) {
      return { response: SALES_VALIDATION_ERRORS.scriptTooShort }
    }
    if (input.length > 500) {
      return { response: SALES_VALIDATION_ERRORS.scriptTooLong }
    }

    session.data.salesScripts.greeting = input
    session.step = SalesAgentStep.SCRIPT_VALUE_PROP
    return { response: `${SALES_PROGRESS_MESSAGES.saved}\n\n${SALES_QUESTIONS[SalesAgentStep.SCRIPT_VALUE_PROP]}` }
  }

  private handleScriptValueProp(session: SalesSession, input: string): ProcessResult {
    if (input.length < 20) {
      return { response: SALES_VALIDATION_ERRORS.scriptTooShort }
    }
    if (input.length > 500) {
      return { response: SALES_VALIDATION_ERRORS.scriptTooLong }
    }

    session.data.salesScripts.valueProposition = input
    session.step = SalesAgentStep.SCRIPT_OBJECTION_1
    return { response: `${SALES_PROGRESS_MESSAGES.saved}\n\n${SALES_QUESTIONS[SalesAgentStep.SCRIPT_OBJECTION_1]}` }
  }

  private handleScriptObjection1(session: SalesSession, input: string): ProcessResult {
    if (input.length < 20) {
      return { response: SALES_VALIDATION_ERRORS.scriptTooShort }
    }
    if (input.length > 500) {
      return { response: SALES_VALIDATION_ERRORS.scriptTooLong }
    }

    session.data.salesScripts.objections.tooExpensive = input
    session.step = SalesAgentStep.SCRIPT_OBJECTION_2
    return { response: `${SALES_PROGRESS_MESSAGES.saved}\n\n${SALES_QUESTIONS[SalesAgentStep.SCRIPT_OBJECTION_2]}` }
  }

  private handleScriptObjection2(session: SalesSession, input: string): ProcessResult {
    if (input.length < 20) {
      return { response: SALES_VALIDATION_ERRORS.scriptTooShort }
    }
    if (input.length > 500) {
      return { response: SALES_VALIDATION_ERRORS.scriptTooLong }
    }

    session.data.salesScripts.objections.needToThink = input
    session.step = SalesAgentStep.SCRIPT_OBJECTION_3
    return { response: `${SALES_PROGRESS_MESSAGES.saved}\n\n${SALES_QUESTIONS[SalesAgentStep.SCRIPT_OBJECTION_3]}` }
  }

  private handleScriptObjection3(session: SalesSession, input: string): ProcessResult {
    if (input.length < 20) {
      return { response: SALES_VALIDATION_ERRORS.scriptTooShort }
    }
    if (input.length > 500) {
      return { response: SALES_VALIDATION_ERRORS.scriptTooLong }
    }

    session.data.salesScripts.objections.notSure = input
    session.step = SalesAgentStep.SCRIPT_CLOSING
    return { response: `${SALES_PROGRESS_MESSAGES.saved}\n\n${SALES_QUESTIONS[SalesAgentStep.SCRIPT_CLOSING]}` }
  }

  private handleScriptClosing(session: SalesSession, input: string): ProcessResult {
    if (input.length < 20) {
      return { response: SALES_VALIDATION_ERRORS.scriptTooShort }
    }
    if (input.length > 500) {
      return { response: SALES_VALIDATION_ERRORS.scriptTooLong }
    }

    session.data.salesScripts.closing = input
    session.step = SalesAgentStep.TONE_FORMALITY
    return { response: `${SALES_PROGRESS_MESSAGES.saved}\n\n${SALES_QUESTIONS[SalesAgentStep.TONE_FORMALITY]}` }
  }

  // --- СТИЛЬ ОБЩЕНИЯ ---
  private handleToneFormality(session: SalesSession, input: string): ProcessResult {
    const choice = parseInt(input, 10) as ToneLevel

    if (choice < 1 || choice > 3) {
      return { response: SALES_VALIDATION_ERRORS.invalidChoice }
    }

    session.data.tone = session.data.tone || { formality: 2, emotion: 2, length: 2 }
    session.data.tone.formality = choice
    session.step = SalesAgentStep.TONE_EMOTION
    return { response: `${SALES_PROGRESS_MESSAGES.saved}\n\n${SALES_QUESTIONS[SalesAgentStep.TONE_EMOTION]}` }
  }

  private handleToneEmotion(session: SalesSession, input: string): ProcessResult {
    const choice = parseInt(input, 10) as ToneLevel

    if (choice < 1 || choice > 3) {
      return { response: SALES_VALIDATION_ERRORS.invalidChoice }
    }

    session.data.tone!.emotion = choice
    session.step = SalesAgentStep.TONE_LENGTH
    return { response: `${SALES_PROGRESS_MESSAGES.saved}\n\n${SALES_QUESTIONS[SalesAgentStep.TONE_LENGTH]}` }
  }

  private handleToneLength(session: SalesSession, input: string): ProcessResult {
    const choice = parseInt(input, 10) as ToneLevel

    if (choice < 1 || choice > 3) {
      return { response: SALES_VALIDATION_ERRORS.invalidChoice }
    }

    session.data.tone!.length = choice
    session.step = SalesAgentStep.EXAMPLE_FIRST_CONTACT_USER
    return { response: `${SALES_PROGRESS_MESSAGES.saved}\n\n${SALES_QUESTIONS[SalesAgentStep.EXAMPLE_FIRST_CONTACT_USER]}` }
  }

  // --- ПРИМЕРЫ ДИАЛОГОВ ---
  private handleExampleFirstContactUser(session: SalesSession, input: string): ProcessResult {
    if (session.data.messageExamples.length === 0) {
      session.data.messageExamples.push({ user: input, agent: '' })
    } else {
      session.data.messageExamples[0].user = input
    }

    session.step = SalesAgentStep.EXAMPLE_FIRST_CONTACT_AGENT
    return { response: `${SALES_PROGRESS_MESSAGES.saved}\n\n${SALES_QUESTIONS[SalesAgentStep.EXAMPLE_FIRST_CONTACT_AGENT]}` }
  }

  private handleExampleFirstContactAgent(session: SalesSession, input: string): ProcessResult {
    session.data.messageExamples[0].agent = input
    session.step = SalesAgentStep.EXAMPLE_OBJECTION_USER
    return { response: `${SALES_PROGRESS_MESSAGES.saved}\n\n${SALES_QUESTIONS[SalesAgentStep.EXAMPLE_OBJECTION_USER]}` }
  }

  private handleExampleObjectionUser(session: SalesSession, input: string): ProcessResult {
    session.data.messageExamples.push({ user: input, agent: '' })
    session.step = SalesAgentStep.EXAMPLE_OBJECTION_AGENT
    return { response: `${SALES_PROGRESS_MESSAGES.saved}\n\n${SALES_QUESTIONS[SalesAgentStep.EXAMPLE_OBJECTION_AGENT]}` }
  }

  private handleExampleObjectionAgent(session: SalesSession, input: string): ProcessResult {
    session.data.messageExamples[1].agent = input
    session.step = SalesAgentStep.PREVIEW

    const preview = generatePreview(session.data)
    return { response: SALES_QUESTIONS[SalesAgentStep.PREVIEW].replace('{preview}', preview) }
  }

  // --- PREVIEW COMMANDS ---
  private handlePreviewCommand(session: SalesSession, input: string): ProcessResult {
    const command = input.toLowerCase()

    switch (command) {
      case 'готово': {
        const character = buildSalesCharacter(session.data)
        const characterJson = exportCharacterJson(character)
        const instructions = generateInstructions(session.data.name || 'agent')

        session.step = SalesAgentStep.DONE
        this.saveSession(session)

        return {
          response: `${SALES_PROGRESS_MESSAGES.generating}\n\n${SALES_QUESTIONS[SalesAgentStep.DONE].replace('{instructions}', instructions)}`,
          character,
          characterJson,
        }
      }

      case 'скрипты':
        session.step = SalesAgentStep.SCRIPT_GREETING
        this.saveSession(session)
        return { response: SALES_QUESTIONS[SalesAgentStep.SCRIPT_GREETING] }

      case 'триггеры':
        session.step = SalesAgentStep.TRIGGERS_SERVICE
        this.saveSession(session)
        return { response: SALES_QUESTIONS[SalesAgentStep.TRIGGERS_SERVICE] }

      case 'цена':
        session.step = SalesAgentStep.PRICE_MONTHLY
        this.saveSession(session)
        return { response: SALES_QUESTIONS[SalesAgentStep.PRICE_MONTHLY] }

      case 'аудитория':
        session.data.targetAudience.segments = []
        session.data.targetAudience.customDescription = undefined
        session.step = SalesAgentStep.TARGET_AUDIENCE_SEGMENTS
        this.saveSession(session)
        return { response: SALES_QUESTIONS[SalesAgentStep.TARGET_AUDIENCE_SEGMENTS] }

      case 'заново':
        this.deleteSession(session.chatId)
        this.getSession(session.chatId, session.userId)
        return { response: SALES_QUESTIONS[SalesAgentStep.ONBOARDING] }

      default:
        return { response: 'Неизвестная команда. Напиши: готово, скрипты, триггеры, цена, аудитория или заново' }
    }
  }

  /**
   * Получение статуса
   */
  getStatus(chatId: string): string {
    const key = getSessionKey(chatId)
    const session = sessions.get(key)

    if (!session) {
      return 'Сессия не найдена. Напиши /create_sales_agent чтобы начать.'
    }

    const stepNames: Record<SalesAgentStep, string> = {
      [SalesAgentStep.ONBOARDING]: 'Тип услуги',
      [SalesAgentStep.NAME]: 'Имя агента',
      [SalesAgentStep.USERNAME]: 'Username',
      [SalesAgentStep.SERVICE_NAME]: 'Название услуги',
      [SalesAgentStep.SERVICE_DESCRIPTION]: 'Описание услуги',
      [SalesAgentStep.PRICE_MONTHLY]: 'Цена подписки',
      [SalesAgentStep.PRICE_CURRENCY]: 'Валюта',
      [SalesAgentStep.PAYMENT_METHODS]: 'Методы оплаты',
      [SalesAgentStep.TARGET_AUDIENCE_SEGMENTS]: 'Целевая аудитория',
      [SalesAgentStep.TARGET_AUDIENCE_CUSTOM]: 'Описание аудитории',
      [SalesAgentStep.TRIGGERS_SERVICE]: 'Триггеры: запросы',
      [SalesAgentStep.TRIGGERS_PAIN]: 'Триггеры: боли',
      [SalesAgentStep.TRIGGERS_READINESS]: 'Триггеры: готовность',
      [SalesAgentStep.SCRIPT_GREETING]: 'Скрипт: приветствие',
      [SalesAgentStep.SCRIPT_VALUE_PROP]: 'Скрипт: ценность',
      [SalesAgentStep.SCRIPT_OBJECTION_1]: 'Скрипт: дорого',
      [SalesAgentStep.SCRIPT_OBJECTION_2]: 'Скрипт: подумаю',
      [SalesAgentStep.SCRIPT_OBJECTION_3]: 'Скрипт: не уверен',
      [SalesAgentStep.SCRIPT_CLOSING]: 'Скрипт: закрытие',
      [SalesAgentStep.TONE_FORMALITY]: 'Тон: формальность',
      [SalesAgentStep.TONE_EMOTION]: 'Тон: эмоциональность',
      [SalesAgentStep.TONE_LENGTH]: 'Тон: длина',
      [SalesAgentStep.EXAMPLE_FIRST_CONTACT_USER]: 'Пример: контакт (user)',
      [SalesAgentStep.EXAMPLE_FIRST_CONTACT_AGENT]: 'Пример: контакт (agent)',
      [SalesAgentStep.EXAMPLE_OBJECTION_USER]: 'Пример: возражение (user)',
      [SalesAgentStep.EXAMPLE_OBJECTION_AGENT]: 'Пример: возражение (agent)',
      [SalesAgentStep.PREVIEW]: 'Предпросмотр',
      [SalesAgentStep.DONE]: 'Готово',
    }

    return `Текущий шаг: ${stepNames[session.step]}\n\nИмя: ${session.data.name || '(не указано)'}\nУслуга: ${session.data.service.name || '(не указано)'}`
  }
}

// Singleton instance
export const salesConfiguratorService = new SalesConfiguratorService()
