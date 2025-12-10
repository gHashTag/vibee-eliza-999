// @ts-nocheck
/**
 * Character Configurator Plugin Tests
 *
 * Тесты для плагина пошаговой конфигурации Character
 */

import { describe, expect, it, beforeEach } from 'bun:test'
import { characterConfiguratorPlugin } from '../plugin.ts'
import { configuratorService } from '../services/configurator.service.ts'
import {
  ConfigStep,
  createEmptySession,
  getSessionKey,
  AVAILABLE_MODELS,
  AVAILABLE_TEMPERATURES,
  BASE_PLUGINS,
  PLATFORM_PLUGINS,
} from '../types/session.types.ts'
import {
  buildCharacter,
  generatePreview,
  generateInstructions,
  exportCharacterJson,
} from '../utils/characterBuilder.ts'

// ============================================================================
// Plugin Configuration Tests
// ============================================================================

describe('Plugin Configuration', () => {
  it('should have correct plugin metadata', () => {
    expect(characterConfiguratorPlugin.name).toBe('plugin-character-configurator')
    expect(characterConfiguratorPlugin.description).toBe(
      'Telegram бот-конфигуратор Character для ElizaOS'
    )
  })

  it('should have actions defined', () => {
    expect(characterConfiguratorPlugin.actions).toBeDefined()
    expect(Array.isArray(characterConfiguratorPlugin.actions)).toBe(true)
    expect(characterConfiguratorPlugin.actions!.length).toBe(5)
  })

  it('should have all required actions', () => {
    const actionNames = characterConfiguratorPlugin.actions!.map((a) => a.name)
    expect(actionNames).toContain('START_CHARACTER_CONFIG')
    expect(actionNames).toContain('RESTART_CHARACTER_CONFIG')
    expect(actionNames).toContain('CHARACTER_CONFIG_HELP')
    expect(actionNames).toContain('CHARACTER_CONFIG_STATUS')
    expect(actionNames).toContain('PROCESS_CHARACTER_CONFIG_INPUT')
  })

  it('should have empty evaluators and providers', () => {
    expect(characterConfiguratorPlugin.evaluators).toEqual([])
    expect(characterConfiguratorPlugin.providers).toEqual([])
  })
})

// ============================================================================
// Session Types Tests
// ============================================================================

describe('Session Types', () => {
  it('should have all ConfigStep values', () => {
    const steps = Object.values(ConfigStep)
    expect(steps.length).toBe(22)
    expect(steps).toContain('onboarding')
    expect(steps).toContain('name')
    expect(steps).toContain('preview')
    expect(steps).toContain('done')
  })

  it('should create empty session correctly', () => {
    const session = createEmptySession('chat123', 'user456')

    expect(session.chatId).toBe('chat123')
    expect(session.userId).toBe('user456')
    expect(session.step).toBe(ConfigStep.ONBOARDING)
    expect(session.data.bio).toEqual([])
    expect(session.data.adjectives).toEqual([])
    expect(session.data.topics).toEqual([])
    expect(session.data.messageExamples).toEqual([])
    expect(session.data.knowledge).toEqual([])
    expect(session.data.plugins).toEqual([])
    expect(session.createdAt).toBeGreaterThan(0)
    expect(session.updatedAt).toBeGreaterThan(0)
  })

  it('should generate session key correctly', () => {
    const key = getSessionKey('chat123')
    expect(key).toBe('character-config-session-chat123')
  })

  it('should have available models defined', () => {
    expect(AVAILABLE_MODELS.length).toBe(3)
    expect(AVAILABLE_MODELS[0].name).toBe('grok-4.1-fast')
    expect(AVAILABLE_MODELS[1].name).toBe('claude-3.5-sonnet')
    expect(AVAILABLE_MODELS[2].name).toBe('gpt-4o')
  })

  it('should have available temperatures defined', () => {
    expect(AVAILABLE_TEMPERATURES.length).toBe(3)
    expect(AVAILABLE_TEMPERATURES[0].value).toBe(0.3)
    expect(AVAILABLE_TEMPERATURES[1].value).toBe(0.5)
    expect(AVAILABLE_TEMPERATURES[2].value).toBe(0.7)
  })

  it('should have base plugins defined', () => {
    expect(BASE_PLUGINS.length).toBe(3)
    expect(BASE_PLUGINS).toContain('@elizaos/plugin-bootstrap')
    expect(BASE_PLUGINS).toContain('@elizaos/plugin-sql')
    expect(BASE_PLUGINS).toContain('@elizaos/plugin-openrouter')
  })

  it('should have platform plugins defined', () => {
    expect(PLATFORM_PLUGINS.telegram).toBe('@elizaos/plugin-telegram')
    expect(PLATFORM_PLUGINS.discord).toBe('@elizaos/plugin-discord')
    expect(PLATFORM_PLUGINS.twitter).toBe('@elizaos/plugin-twitter')
    expect(PLATFORM_PLUGINS.web).toBe('@elizaos/plugin-direct')
  })
})

// ============================================================================
// Configurator Service Tests
// ============================================================================

describe('ConfiguratorService', () => {
  beforeEach(() => {
    // Clear all sessions before each test
    configuratorService.deleteSession('test-chat-1')
    configuratorService.deleteSession('test-chat-2')
  })

  it('should create new session', () => {
    const session = configuratorService.getSession('test-chat-1', 'user-1')

    expect(session).toBeDefined()
    expect(session.chatId).toBe('test-chat-1')
    expect(session.userId).toBe('user-1')
    expect(session.step).toBe(ConfigStep.ONBOARDING)
  })

  it('should return existing session', () => {
    const session1 = configuratorService.getSession('test-chat-1', 'user-1')
    const session2 = configuratorService.getSession('test-chat-1', 'user-1')

    expect(session1).toBe(session2)
  })

  it('should delete session', () => {
    configuratorService.getSession('test-chat-1', 'user-1')
    configuratorService.deleteSession('test-chat-1')

    // New session should be created
    const newSession = configuratorService.getSession('test-chat-1', 'user-1')
    expect(newSession.step).toBe(ConfigStep.ONBOARDING)
  })

  it('should get status for non-existent session', () => {
    const status = configuratorService.getStatus('non-existent-chat')
    expect(status).toContain('Сессия не найдена')
  })

  it('should get status for existing session', () => {
    configuratorService.getSession('test-chat-1', 'user-1')
    const status = configuratorService.getStatus('test-chat-1')

    expect(status).toContain('Текущий шаг')
    expect(status).toContain('Выбор типа агента')
  })

  it('should process archetype selection (expert)', async () => {
    configuratorService.getSession('test-chat-1', 'user-1')
    const result = await configuratorService.processMessage('test-chat-1', 'user-1', '1')

    expect(result.response).toContain('звать')
    const session = configuratorService.getSession('test-chat-1', 'user-1')
    expect(session.data.archetype).toBe('expert')
    expect(session.step).toBe(ConfigStep.NAME)
  })

  it('should process archetype selection (custom)', async () => {
    configuratorService.getSession('test-chat-1', 'user-1')
    const result = await configuratorService.processMessage('test-chat-1', 'user-1', '5')

    // При выборе 5 или любой нечисловой строки - custom архетип с переходом к NAME
    expect(result.response).toContain('звать')
    const session = configuratorService.getSession('test-chat-1', 'user-1')
    expect(session.data.archetype).toBe('custom')
    expect(session.step).toBe(ConfigStep.NAME)
  })

  it('should process name input', async () => {
    const session = configuratorService.getSession('test-chat-1', 'user-1')
    session.step = ConfigStep.NAME

    const result = await configuratorService.processMessage('test-chat-1', 'user-1', 'Мой Агент')

    expect(result.response).toContain('Username')
    expect(session.data.name).toBe('Мой Агент')
    expect(session.step).toBe(ConfigStep.USERNAME)
  })

  it('should skip optional fields', async () => {
    const session = configuratorService.getSession('test-chat-1', 'user-1')
    session.step = ConfigStep.USERNAME

    const result = await configuratorService.processMessage('test-chat-1', 'user-1', 'пропустить')

    expect(session.data.username).toBeUndefined()
    expect(session.step).toBe(ConfigStep.BIO_ROLE)
  })

  it('should process bio fields', async () => {
    const session = configuratorService.getSession('test-chat-1', 'user-1')
    session.step = ConfigStep.BIO_ROLE

    await configuratorService.processMessage('test-chat-1', 'user-1', 'Программист')
    expect(session.data.bio.length).toBe(1)
    expect(session.data.bio[0]).toBe('Программист')
    expect(session.step).toBe(ConfigStep.BIO_EXPERTISE)
  })

  it('should process tone formality', async () => {
    const session = configuratorService.getSession('test-chat-1', 'user-1')
    session.step = ConfigStep.TONE_FORMALITY

    await configuratorService.processMessage('test-chat-1', 'user-1', '1')

    expect(session.data.tone?.formality).toBe(1)
    expect(session.step).toBe(ConfigStep.TONE_EMOTION)
  })

  it('should process adjectives', async () => {
    const session = configuratorService.getSession('test-chat-1', 'user-1')
    session.step = ConfigStep.ADJECTIVES

    await configuratorService.processMessage(
      'test-chat-1',
      'user-1',
      'дружелюбный, умный, весёлый'
    )

    expect(session.data.adjectives.length).toBe(3)
    expect(session.data.adjectives).toContain('дружелюбный')
    expect(session.data.adjectives).toContain('умный')
    expect(session.data.adjectives).toContain('весёлый')
  })

  it('should process model selection', async () => {
    const session = configuratorService.getSession('test-chat-1', 'user-1')
    session.step = ConfigStep.SETTINGS_MODEL

    await configuratorService.processMessage('test-chat-1', 'user-1', '2')

    expect(session.data.settings?.model).toBe('claude-3.5-sonnet')
    expect(session.step).toBe(ConfigStep.SETTINGS_TEMPERATURE)
  })

  it('should handle invalid input gracefully', async () => {
    // На шаге ONBOARDING любой текст (не 1-5) считается custom архетипом
    // Тест перенесён на шаг выбора тона, где есть валидация
    const session = configuratorService.getSession('test-chat-1', 'user-1')
    session.step = ConfigStep.TONE_FORMALITY

    const result = await configuratorService.processMessage('test-chat-1', 'user-1', 'invalid')

    expect(result.response).toContain('Выбери')
  })

  it('should generate character on DONE step', async () => {
    const session = configuratorService.getSession('test-chat-1', 'user-1')
    session.step = ConfigStep.PREVIEW
    session.data = {
      archetype: 'expert',
      name: 'Test Agent',
      bio: ['Bio line 1', 'Bio line 2'],
      adjectives: ['smart', 'friendly'],
      topics: ['programming', 'AI'],
      messageExamples: [{ user: 'Hello', agent: 'Hi there!' }],
      knowledge: [],
      plugins: ['telegram'],
      settings: { model: 'grok-4.1-fast', modelProvider: 'openrouter', temperature: 0.5 },
      tone: { formality: 2, emotion: 2, length: 2 },
    }

    const result = await configuratorService.processMessage('test-chat-1', 'user-1', 'готово')

    expect(result.characterJson).toBeDefined()
    expect(session.step).toBe(ConfigStep.DONE)
  })
})

// ============================================================================
// Character Builder Tests
// ============================================================================

describe('CharacterBuilder', () => {
  const sampleData = {
    archetype: 'expert' as const,
    name: 'Test Agent',
    username: 'test_agent',
    bio: ['Expert in AI', 'Loves coding'],
    adjectives: ['smart', 'helpful', 'patient'],
    topics: ['artificial intelligence', 'programming', 'machine learning'],
    messageExamples: [
      { user: 'Hello!', agent: 'Hi! How can I help you today?' },
      { user: 'Tell me about AI', agent: 'AI is fascinating! Let me explain...' },
    ],
    knowledge: ['AI basics', 'ML fundamentals'],
    plugins: ['telegram', 'discord'],
    settings: {
      model: 'grok-4.1-fast',
      modelProvider: 'openrouter',
      temperature: 0.5,
    },
    tone: {
      formality: 2 as const,
      emotion: 2 as const,
      length: 2 as const,
    },
  }

  it('should build valid character', () => {
    const character = buildCharacter(sampleData)

    expect(character.name).toBe('Test Agent')
    expect(character.username).toBe('test_agent')
    expect(character.bio).toEqual(sampleData.bio)
    expect(character.adjectives).toEqual(sampleData.adjectives)
    expect(character.topics).toEqual(sampleData.topics)
  })

  it('should format message examples correctly', () => {
    const character = buildCharacter(sampleData)

    expect(character.messageExamples).toBeDefined()
    expect(character.messageExamples!.length).toBe(2)
    expect(character.messageExamples![0][0].user).toBe('{{user1}}')
    expect(character.messageExamples![0][0].content.text).toBe('Hello!')
    expect(character.messageExamples![0][1].user).toBe('Test Agent')
    expect(character.messageExamples![0][1].content.text).toBe('Hi! How can I help you today?')
  })

  it('should include knowledge if provided', () => {
    const character = buildCharacter(sampleData)
    expect(character.knowledge).toEqual(['AI basics', 'ML fundamentals'])
  })

  it('should not include knowledge if empty', () => {
    const dataWithoutKnowledge = { ...sampleData, knowledge: [] }
    const character = buildCharacter(dataWithoutKnowledge)
    expect(character.knowledge).toBeUndefined()
  })

  it('should build plugins list with base and platform plugins', () => {
    const character = buildCharacter(sampleData)

    expect(character.plugins).toContain('@elizaos/plugin-bootstrap')
    expect(character.plugins).toContain('@elizaos/plugin-sql')
    expect(character.plugins).toContain('@elizaos/plugin-openrouter')
    expect(character.plugins).toContain('@elizaos/plugin-telegram')
    expect(character.plugins).toContain('@elizaos/plugin-discord')
  })

  it('should set model settings correctly', () => {
    const character = buildCharacter(sampleData)

    expect(character.settings?.model).toBe('xai/grok-beta')
    expect(character.settings?.modelConfig?.temperature).toBe(0.5)
  })

  it('should generate style based on tone', () => {
    const character = buildCharacter(sampleData)

    expect(character.style).toBeDefined()
    expect(character.style!.all).toBeDefined()
    expect(Array.isArray(character.style!.all)).toBe(true)
    expect(character.style!.all!.length).toBeGreaterThan(0)
  })

  it('should generate preview', () => {
    const preview = generatePreview(sampleData)

    expect(preview).toContain('Test Agent')
    expect(preview).toContain('test_agent')
    expect(preview).toContain('Bio')
    expect(preview).toContain('Черты')
    expect(preview).toContain('smart')
  })

  it('should generate instructions', () => {
    const instructions = generateInstructions('Test Agent')

    expect(instructions).toContain('test-agent.character.json')
    expect(instructions).toContain('elizaos start')
    expect(instructions).toContain('characters/')
    expect(instructions).toContain('https://docs.elizaos.ai')
  })

  it('should export character to JSON', () => {
    const character = buildCharacter(sampleData)
    const json = exportCharacterJson(character)

    expect(json).toBeDefined()
    const parsed = JSON.parse(json)
    expect(parsed.name).toBe('Test Agent')
    expect(parsed.username).toBe('test_agent')
  })

  it('should handle missing optional fields', () => {
    const minimalData = {
      bio: [],
      adjectives: [],
      topics: [],
      messageExamples: [],
      knowledge: [],
      plugins: [],
    }

    const character = buildCharacter(minimalData)

    expect(character.name).toBe('Agent')
    expect(character.username).toBe('agent')
  })

  it('should generate informal style for low formality', () => {
    const informalData = {
      ...sampleData,
      tone: { formality: 1 as const, emotion: 1 as const, length: 1 as const },
    }

    const character = buildCharacter(informalData)

    expect(character.style!.all!.some((s) => s.includes('неформально'))).toBe(true)
  })

  it('should generate formal style for high formality', () => {
    const formalData = {
      ...sampleData,
      tone: { formality: 3 as const, emotion: 3 as const, length: 3 as const },
    }

    const character = buildCharacter(formalData)

    expect(character.style!.all!.some((s) => s.includes('деловой'))).toBe(true)
  })
})

// ============================================================================
// Integration Tests
// ============================================================================

describe('Integration Tests', () => {
  beforeEach(() => {
    configuratorService.deleteSession('integration-test')
  })

  it('should complete full configuration flow', async () => {
    const chatId = 'integration-test'
    const userId = 'user-integration'

    // Step 1: Start - select archetype
    configuratorService.getSession(chatId, userId)
    await configuratorService.processMessage(chatId, userId, '1') // expert

    // Step 2: Name
    await configuratorService.processMessage(chatId, userId, 'Integration Agent')

    // Step 3: Username
    await configuratorService.processMessage(chatId, userId, 'integration_agent')

    // Step 4-7: Bio (4 fields)
    await configuratorService.processMessage(chatId, userId, 'AI Expert')
    await configuratorService.processMessage(chatId, userId, 'Machine Learning')
    await configuratorService.processMessage(chatId, userId, 'Developers')
    await configuratorService.processMessage(chatId, userId, 'Unique personality')

    // Step 8-10: Tone
    await configuratorService.processMessage(chatId, userId, '2') // formality
    await configuratorService.processMessage(chatId, userId, '2') // emotion
    await configuratorService.processMessage(chatId, userId, '2') // length

    // Step 11: Adjectives (minimum 3)
    await configuratorService.processMessage(chatId, userId, 'smart, helpful, friendly')

    // Step 12: Topics
    await configuratorService.processMessage(chatId, userId, 'AI, ML')

    // Step 13-16: Examples
    await configuratorService.processMessage(chatId, userId, 'Привет!')
    await configuratorService.processMessage(chatId, userId, 'Привет! Чем помочь?')
    await configuratorService.processMessage(chatId, userId, 'Что такое AI?')
    await configuratorService.processMessage(chatId, userId, 'AI - это искусственный интеллект')

    // Step 17: Knowledge (skip)
    await configuratorService.processMessage(chatId, userId, 'пропустить')

    // Step 18: Plugins
    await configuratorService.processMessage(chatId, userId, 'telegram')

    // Step 19-20: Settings
    await configuratorService.processMessage(chatId, userId, '1') // model
    await configuratorService.processMessage(chatId, userId, '2') // temperature

    // Check we're at preview
    const session = configuratorService.getSession(chatId, userId)
    expect(session.step).toBe(ConfigStep.PREVIEW)

    // Step 21: Confirm
    const finalResult = await configuratorService.processMessage(chatId, userId, 'готово')

    expect(finalResult.characterJson).toBeDefined()
    expect(session.step).toBe(ConfigStep.DONE)

    // Verify generated character
    const character = JSON.parse(finalResult.characterJson!)
    expect(character.name).toBe('Integration Agent')
    expect(character.username).toBe('integration_agent')
    expect(character.bio.length).toBe(4)
    expect(character.plugins).toContain('@elizaos/plugin-telegram')
  })
})
