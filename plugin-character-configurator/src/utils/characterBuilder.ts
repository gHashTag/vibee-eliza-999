// @ts-nocheck
/**
 * Character Builder
 *
 * Сборка валидного Character объекта из данных сессии
 */

import type { Character } from '@elizaos/core'
import {
  type CharacterData,
  type ToneSettings,
  AVAILABLE_MODELS,
  BASE_PLUGINS,
  PLATFORM_PLUGINS,
} from '../types/session.types.ts'

/**
 * Генерация style.all на основе настроек тона
 */
function generateStyleAll(tone: ToneSettings, adjectives: string[]): string[] {
  const styles: string[] = []

  // Формальность
  if (tone.formality === 1) {
    styles.push('Общайся неформально, как друг в чате')
    styles.push('Можно использовать сленг и разговорные выражения')
  } else if (tone.formality === 2) {
    styles.push('Общайся вежливо, но без излишнего официоза')
  } else {
    styles.push('Используй деловой стиль общения')
    styles.push('Избегай сленга и разговорных выражений')
  }

  // Эмоциональность
  if (tone.emotion === 1) {
    styles.push('Будь сдержанным, фокусируйся на фактах')
    styles.push('Избегай эмодзи и восклицательных знаков')
  } else if (tone.emotion === 2) {
    styles.push('Добавляй немного эмоций в ответы')
    styles.push('Иногда используй эмодзи')
  } else {
    styles.push('Будь эмоциональным и живым')
    styles.push('Активно используй эмодзи и восклицательные знаки')
  }

  // Длина ответов
  if (tone.length === 1) {
    styles.push('Отвечай коротко - 1-2 предложения')
    styles.push('Не разводи воду, только суть')
  } else if (tone.length === 2) {
    styles.push('Давай ответы средней длины - один абзац')
  } else {
    styles.push('Давай развёрнутые, подробные ответы')
    styles.push('Объясняй детально с примерами')
  }

  // Добавляем черты характера
  if (adjectives.length > 0) {
    styles.push(`Твои черты характера: ${adjectives.join(', ')}`)
  }

  return styles
}

/**
 * Генерация style.chat
 */
function generateStyleChat(tone: ToneSettings): string[] {
  const styles: string[] = []

  if (tone.formality === 1) {
    styles.push('В чате будь максимально неформальным')
    styles.push('Используй сокращения и разговорный язык')
  }

  if (tone.emotion === 3) {
    styles.push('В чате можно больше эмодзи и юмора')
  }

  if (tone.length === 1) {
    styles.push('В чате отвечай ещё короче')
  }

  return styles
}

/**
 * Преобразование messageExamples в формат ElizaOS
 */
function formatMessageExamples(
  examples: { user: string; agent: string }[],
  agentName: string
): Character['messageExamples'] {
  return examples.map((example) => [
    {
      user: '{{user1}}',
      content: { text: example.user },
    },
    {
      user: agentName,
      content: { text: example.agent },
    },
  ])
}

/**
 * Сборка списка плагинов
 */
function buildPluginsList(platforms: string[]): string[] {
  const plugins: string[] = [...BASE_PLUGINS]

  for (const platform of platforms) {
    const normalizedPlatform = platform.toLowerCase().trim()
    if (normalizedPlatform in PLATFORM_PLUGINS) {
      plugins.push(PLATFORM_PLUGINS[normalizedPlatform as keyof typeof PLATFORM_PLUGINS])
    }
  }

  return plugins
}

/**
 * Построение Character объекта
 */
export function buildCharacter(data: CharacterData): Character {
  const name = data.name || 'Agent'
  const model = data.settings
    ? AVAILABLE_MODELS.find((m) => m.name === data.settings?.model) || AVAILABLE_MODELS[0]
    : AVAILABLE_MODELS[0]

  const tone = data.tone || { formality: 2, emotion: 2, length: 2 }

  const character: Character = {
    name,
    username: data.username || name.toLowerCase().replace(/\s+/g, '_'),
    bio: data.bio,
    adjectives: data.adjectives,
    topics: data.topics,
    knowledge: data.knowledge.length > 0 ? data.knowledge : undefined,
    messageExamples: formatMessageExamples(data.messageExamples, name),
    style: {
      all: generateStyleAll(tone, data.adjectives),
      chat: generateStyleChat(tone),
      post: [],
    },
    plugins: buildPluginsList(data.plugins),
    settings: {
      model: model.id,
      modelConfig: {
        temperature: data.settings?.temperature || 0.5,
      },
    },
  }

  return character
}

/**
 * Генерация превью Character (человекочитаемый формат)
 */
export function generatePreview(data: CharacterData): string {
  const lines: string[] = []

  lines.push(`Имя: ${data.name || '(не указано)'}`)

  if (data.username) {
    lines.push(`Username: @${data.username}`)
  }

  if (data.bio.length > 0) {
    lines.push(`\nBio:`)
    data.bio.forEach((line) => lines.push(`  - ${line}`))
  }

  if (data.adjectives.length > 0) {
    lines.push(`\nЧерты: ${data.adjectives.join(', ')}`)
  }

  if (data.topics.length > 0) {
    lines.push(`Темы: ${data.topics.join(', ')}`)
  }

  if (data.tone) {
    const formality = ['неформально', 'нейтрально', 'формально'][data.tone.formality - 1]
    const emotion = ['сдержанно', 'умеренно', 'эмоционально'][data.tone.emotion - 1]
    const length = ['коротко', 'средне', 'развёрнуто'][data.tone.length - 1]
    lines.push(`\nСтиль: ${formality}, ${emotion}, ${length}`)
  }

  if (data.messageExamples.length > 0) {
    lines.push(`\nПримеры диалогов: ${data.messageExamples.length}`)
  }

  if (data.knowledge.length > 0) {
    lines.push(`Знания: ${data.knowledge.length} записей`)
  }

  if (data.plugins.length > 0) {
    lines.push(`\nПлатформы: ${data.plugins.join(', ')}`)
  }

  if (data.settings) {
    lines.push(`Модель: ${data.settings.model}`)
    lines.push(`Температура: ${data.settings.temperature}`)
  }

  return lines.join('\n')
}

/**
 * Генерация инструкций по использованию
 */
export function generateInstructions(characterName: string): string {
  const filename = `${characterName.toLowerCase().replace(/\s+/g, '-')}.character.json`

  return `Файл: ${filename}

Как использовать:
1. Сохрани файл в папку characters/
2. Запусти агента:
   elizaos start --character characters/${filename}

Или добавь в project.json:
{
  "agents": [
    { "character": "characters/${filename}" }
  ]
}

Документация: https://docs.elizaos.ai`
}

/**
 * Экспорт Character в JSON
 */
export function exportCharacterJson(character: Character): string {
  return JSON.stringify(character, null, 2)
}
