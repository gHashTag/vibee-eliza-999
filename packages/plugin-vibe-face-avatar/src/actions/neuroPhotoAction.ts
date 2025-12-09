/**
 * @fileoverview Avatar Face Plugin - NeuroPhoto Action
 *
 * Action for generating images using trained LoRA models
 *
 * @author Vibe Team
 * @version 1.0.0
 */

import type {
  Action,
  ActionResult,
  HandlerCallback,
  IAgentRuntime,
  Memory,
  State,
  ActionExample,
} from '@elizaos/core'
import { GenerateAvatarPhotoInputSchema } from '../types/schemas.js'
import { SERVICE_PRICING } from '../database/servicePricing.config.js'
import { FalAiProvider } from '../neurophoto/providers/implementations/FalAiProvider.js'
import type {
  GenerationOptions,
  ImageResult,
  ProviderConfig,
} from '../neurophoto/types.js'

export const neuroPhotoAction: Action = {
  name: 'GENERATE_AVATAR_PHOTO',
  similes: [
    'NEUROPHOTO',
    'GENERATE_IMAGE',
    'CREATE_PHOTO',
    'СГЕНЕРИРОВАТЬ_ФОТО',
    'НЕЙРОФОТО',
  ],
  description: `Генерирует AI-изображения с помощью персональных LoRA моделей пользователя.
Использует ТОЛЬКО модели, которые пользователь обучил через "🤖 Цифровое тело аватара"

Используй когда пользователь:
- Просит сгенерировать изображение
- Хочет увидеть как что-то выглядит
- Спрашивает про NeuroPhoto
- Использует команду "📸 NeuroPhoto"
- Упоминает генерацию изображений

ВАЖНО: НЕ используй общие модели (Flux Schnell, SDXL и т.д.) - только пользовательские LoRA модели!`,

  /**
   * Валидация - должна ли выполняться эта action?
   */
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase()

    if (!text) return false

    // Прямые команды (высокий приоритет)
    const commands = [
      '📸 нейрофото',
      'neurophoto',
      'сгенерировать фото',
      'создать фото',
      'создай фото',
      'generate photo',
      'create photo',
    ]

    if (commands.some((cmd) => text.includes(cmd))) {
      return true
    }

    // Интенты (естественный язык)
    const intents = [
      // Русский
      'сгенерируй изображение',
      'создай изображение',
      'нарисуй',
      'сделай картинку',
      'хочу фото',
      'покажи как выглядит',
      'сделай фото',
      'сгенерируй картинку',
      'изображение моего аватара',
      'фото используя мою модель',

      // English
      'generate image',
      'create image',
      'draw',
      'make a picture',
      'show me how',
      'can you draw',
      'make an image',
      'avatar image',
      'using my model',
    ]

    return intents.some((intent) => text.includes(intent))
  },

  /**
   * Обработчик действия
   */
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State | undefined,
    options,
    callback?: HandlerCallback
  ): Promise<ActionResult> => {
    try {
      const text = message.content?.text || ''
      // Безопасное получение userId из Memory
      const userId = (message as any).userId
      const telegramId = userId ? Number(userId) : 0
      const botName = message.content?.source || 'default'

      if (!telegramId) {
        await callback?.({
          text: '❌ Не удалось определить пользователя.',
        })
        return {
          success: false,
          error: new Error('User ID not found'),
        }
      }

      // Извлекаем промпт из текста
      const prompt = extractPrompt(text)

      if (!prompt || prompt.length < 3) {
        await callback?.({
          text: `❌ Пожалуйста, опишите какое изображение вы хотите создать.

**Примеры**:
• 📸 NeuroPhoto красивый закат над океаном
• 📸 NeuroPhoto футуристический город с летающими машинами
• 📸 NeuroPhoto портрет в стиле киберпанк

Минимальная длина описания: 3 символа.`,
        })
        return {
          success: false,
          error: new Error('Промпт слишком короткий'),
        }
      }

      // Уведомляем пользователя о начале генерации
      await callback?.({
        text: '📸 Генерирую изображение, это займёт 10-30 секунд...',
      })

      // Получаем FAL API ключ из окружения
      const falKey = process.env.FAL_KEY || process.env.FAL_API_KEY

      if (!falKey) {
        await callback?.({
          text: '❌ Ошибка: FAL API ключ не найден в настройках. Обратитесь к администратору.',
        })
        return {
          success: false,
          error: new Error('FAL API key not found'),
        }
      }

      try {
        // Создаём и инициализируем провайдер
        const provider = new FalAiProvider()
        const config: ProviderConfig = {
          id: 'neurophoto-default',
          type: 'fal',
          name: 'Fal.ai (NeuroPhoto)',
          enabled: true,
          priority: 100,
          apiKey: falKey,
          defaultModel: 'fal-ai/flux-dev',
          defaultSettings: {
            imageSize: 'portrait_4_3',
            numInferenceSteps: 28,
            guidanceScale: 3.5,
            enableSafetyChecker: true,
            outputFormat: 'jpeg',
          },
        }

        await provider.initialize(config)

        // Формируем опции генерации
        const generationOptions: GenerationOptions = {
          prompt: prompt,
          model: 'fal-ai/flux-dev',
          imageSize: 'portrait_4_3',
          numInferenceSteps: 28,
          guidanceScale: 3.5,
          enableSafetyChecker: true,
          outputFormat: 'jpeg',
          numImages: 1,
        }

        // Генерируем изображение
        const result: ImageResult = await provider.generate(generationOptions)

        // Формируем ответ пользователю
        const response = `📸 **NeuroPhoto - Генерация завершена!**

✅ **Результат**:
├─ 🖼️ [Скачать изображение](${result.url})
├─ 📐 Размер: ${result.width}×${result.height}
├─ ⏱️ Время генерации: ${Math.round(result.generationTimeMs / 1000)}с
├─ 🎯 Промпт: "${prompt}"
└─ 🤖 Модель: ${result.model}

💰 Списано: ${SERVICE_PRICING.NEUROPHOTO.stars}⭐`

        await callback?.({
          text: response,
        })

        return {
          success: true,
          text: 'Image generated successfully',
          data: {
            action: 'GENERATE_AVATAR_PHOTO',
            prompt,
            imageUrl: result.url,
            width: result.width,
            height: result.height,
            generationTimeMs: result.generationTimeMs,
            cost: SERVICE_PRICING.NEUROPHOTO.stars,
            model: result.model,
          },
        }
      } catch (error) {
        console.error('[NeuroPhoto] Generation error:', error)

        await callback?.({
          text: `❌ **Ошибка генерации изображения**

Детали: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}

💰 Мы вернули вам ${SERVICE_PRICING.NEUROPHOTO.stars} звезд.

Попробуйте ещё раз или обратитесь к администратору.`,
        })

        return {
          success: false,
          error: error instanceof Error ? error : new Error(String(error)),
        }
      }
    } catch (error) {
      await callback?.({
        text: '❌ Произошла ошибка при генерации изображения.',
      })
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }
    }
  },

  /**
   * Примеры для обучения LLM
   */
  examples: [
    [
      {
        name: 'user',
        content: { text: '📸 NeuroPhoto красивый закат над океаном' },
      },
      {
        name: 'assistant',
        content: {
          text: '📸 Генерирую изображение вашего аватара...',
          action: 'GENERATE_AVATAR_PHOTO',
        },
      },
    ],
    [
      {
        name: 'user',
        content: { text: 'нарисуй футуристический город' },
      },
      {
        name: 'assistant',
        content: {
          text: '📸 Генерирую изображение...',
          action: 'GENERATE_AVATAR_PHOTO',
        },
      },
    ],
  ] as ActionExample[][],
}

/**
 * Извлечение промпта из текста сообщения
 */
function extractPrompt(text: string): string {
  return text
    .replace(/📸/g, '')
    .replace(/neurophoto/gi, '')
    .replace(/сгенерировать фото/gi, '')
    .replace(/создать фото/gi, '')
    .replace(/generate photo/gi, '')
    .replace(/create photo/gi, '')
    .replace(/нарисуй/gi, '')
    .replace(/generate image/gi, '')
    .replace(/create image/gi, '')
    .replace(/draw/gi, '')
    .trim()
}
