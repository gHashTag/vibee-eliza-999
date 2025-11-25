import { ImageGenerationProvider, ModelInfo } from '../types/provider.interface'
import { TaskEither, tryCatchAsync, left } from '../utils/functional/result'
import { GenerateImageOptions, ImageGenerationResult } from '../types'
import { getImageModelsByProvider, getImageModel } from '../config/image-models.config'
import Replicate from 'replicate'

/**
 * Replicate Provider - реализация интерфейса ImageGenerationProvider
 * Поддерживает все модели Replicate (Flux, SDXL, SD3, Recraft, Photon и др.)
 */
export class ReplicateProvider implements ImageGenerationProvider {
  name = 'replicate'
  description = 'AI image generation using Replicate API with Flux, SDXL, SD3, Recraft, Photon and other models'

  private client: Replicate | null = null
  private apiKey: string | null = null

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.client = new Replicate({ auth: apiKey })
  }

  get supportedModels(): string[] {
    return getImageModelsByProvider('replicate').map(model => model.id)
  }

  healthCheck(): TaskEither<Error, { status: 'healthy' | 'unhealthy' }> {
    return tryCatchAsync(
      async () => {
        // Простая проверка - пытаемся получить список моделей
        if (!this.client) {
          throw new Error('Replicate client не инициализирован')
        }
        return { status: 'healthy' as const }
      },
      (error) => error instanceof Error ? error : new Error(String(error))
    )
  }

  generateImage(options: GenerateImageOptions): TaskEither<Error, ImageGenerationResult> {
    if (!this.client) {
      return left(new Error('Replicate Provider не инициализирован'))
    }

    return tryCatchAsync(
      async () => {
        const startTime = Date.now()

        // Получаем конфигурацию модели
        const modelConfig = options.modelId
          ? getImageModel(options.modelId)
          : getImageModel('flux_schnell') // По умолчанию

        if (!modelConfig) {
          throw new Error(`Модель не найдена: ${options.modelId || 'flux_schnell'}`)
        }

        const modelUrl = modelConfig.apiModel
        const numImages = Math.min(options.numImages || 1, modelConfig.apiSettings.maxImages)

        // Подготовка input для Replicate
        const input: any = {
          prompt: options.prompt,
          num_outputs: numImages,
        }

        // Добавляем параметры в зависимости от поддержки модели
        if (options.aspectRatio && modelConfig.apiSettings.aspectRatios.includes(options.aspectRatio)) {
          input.aspect_ratio = options.aspectRatio
        }

        if (options.negativePrompt && modelConfig.apiSettings.supportsNegativePrompt) {
          input.negative_prompt = options.negativePrompt
        }

        if (options.steps && modelConfig.apiSettings.supportsSteps) {
          input.num_inference_steps = options.steps
        }

        if (options.guidanceScale && modelConfig.apiSettings.supportsGuidanceScale) {
          input.guidance_scale = options.guidanceScale
        }

        if (options.seed && modelConfig.apiSettings.supportsSeed) {
          input.seed = options.seed
        }

        // Добавляем базовые параметры из конфигурации
        if (modelConfig.apiSettings.baseInput) {
          Object.assign(input, modelConfig.apiSettings.baseInput)
        }

        // Генерация через Replicate
        const output = await this.client!.run(modelUrl as any, { input })
        const generationTime = Date.now() - startTime

        // Парсинг результата
        let imageUrls: string[]
        if (Array.isArray(output)) {
          imageUrls = output.filter((url) => typeof url === 'string')
        } else if (typeof output === 'string') {
          imageUrls = [output]
        } else if (output && typeof output === 'object' && 'output' in output) {
          const outputData = (output as any).output
          imageUrls = Array.isArray(outputData) ? outputData : [outputData]
        } else {
          throw new Error('Неожиданный формат ответа от Replicate')
        }

        return {
          success: true,
          imageUrls,
          metadata: {
            prompt: options.prompt,
            model: modelUrl,
            generationTime,
          },
        } as ImageGenerationResult
      },
      (error) => error instanceof Error ? error : new Error(String(error))
    )
  }

  getModelInfo(modelId: string): TaskEither<Error, ModelInfo> {
    return tryCatchAsync(
      async () => {
        const modelConfig = getImageModel(modelId)
        if (!modelConfig) {
          throw new Error(`Модель не найдена: ${modelId}`)
        }

        return {
          id: modelConfig.id,
          name: modelConfig.name,
          provider: modelConfig.provider,
          description: modelConfig.description,
          pricePerImage: modelConfig.pricing.fixedPriceStars || 0,
          estimatedTime: 10, // Примерное время генерации
          supportedFeatures: [
            ...(modelConfig.apiSettings.supportsNegativePrompt ? ['negative-prompt'] : []),
            ...(modelConfig.apiSettings.supportsSeed ? ['seed'] : []),
            ...(modelConfig.apiSettings.supportsSteps ? ['steps'] : []),
            ...(modelConfig.apiSettings.supportsGuidanceScale ? ['guidance-scale'] : []),
            ...(modelConfig.apiSettings.supportsLoRA ? ['lora'] : []),
          ],
          aspectRatios: modelConfig.apiSettings.aspectRatios,
          maxImages: modelConfig.apiSettings.maxImages,
        }
      },
      (error) => error instanceof Error ? error : new Error(String(error))
    )
  }

  listModels(): TaskEither<Error, ModelInfo[]> {
    return tryCatchAsync(
      async () => {
        const models = getImageModelsByProvider('replicate')
        return Promise.all(
          models.map(model => this.getModelInfo(model.id)())
        ).then(results =>
          results
            .filter(result => result.isRight())
            .map(result => (result as any).value)
        )
      },
      (error) => error instanceof Error ? error : new Error(String(error))
    )
  }
}
