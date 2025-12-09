/**
 * @fileoverview Avatar Face Plugin for ElizaOS
 *
 * Plugin for training personal LoRA models and generating AI images
 *
 * @author Vibe Team
 * @version 1.0.0
 */

import type {
  GenerateTextParams,
  IAgentRuntime,
  Plugin,
} from '@elizaos/core'
import { ModelType, Service as CoreService, logger } from '@elizaos/core'
import { z } from 'zod'

import { avatarFaceProvider } from './providers/avatarFaceProvider.js'
import { digitalAvatarBodyAction, neuroPhotoAction } from './actions/index.js'
import { UserModelDatabaseService, createUserModelDatabaseService } from './database/userModelService.js'

/**
 * Configuration schema for Avatar Face plugin
 */
const configSchema = z.object({
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_KEY: z.string().optional(),
  FAL_API_KEY: z.string().optional(),
  DEFAULT_MODEL: z.string().optional(),
})

/**
 * Avatar Face Plugin Service
 */
export class AvatarFaceService extends CoreService {
  static serviceType = 'avatar-face'

  capabilityDescription =
    'Avatar Face Service - trains LoRA models and generates AI images'

  private userModelService: UserModelDatabaseService | null = null

  constructor(protected runtime: IAgentRuntime) {
    super(runtime)
  }

  static async start(runtime: IAgentRuntime): Promise<AvatarFaceService> {
    logger.info('Starting Avatar Face service')
    const service = new AvatarFaceService(runtime)

    // Initialize user model database service
    const supabaseUrl = runtime.getSetting('SUPABASE_URL')
    const supabaseKey = runtime.getSetting('SUPABASE_KEY')

    if (supabaseUrl && supabaseKey) {
      service.userModelService = createUserModelDatabaseService({
        supabaseUrl,
        supabaseKey,
      })
      logger.info('User model database service initialized')
    } else {
      logger.warn('Supabase credentials not found, database features will be limited')
    }

    return service
  }

  static async stop(runtime: IAgentRuntime): Promise<void> {
    logger.info('Stopping Avatar Face service')
    const service = runtime.getService(AvatarFaceService.serviceType)
    if (!service) {
      throw new Error('Avatar Face service not found')
    }
    service.stop()
  }

  async stop(): Promise<void> {
    logger.info('Stopping AvatarFaceService')
    this.userModelService = null
  }

  /**
   * Get user model database service
   */
  getUserModelService(): UserModelDatabaseService {
    if (!this.userModelService) {
      throw new Error('User model database service not initialized')
    }
    return this.userModelService
  }
}

/**
 * Main Avatar Face Plugin
 */
export const avatarFacePlugin: Plugin = {
  name: 'vibe-avatar-face',
  description: 'Avatar Face Plugin - Digital Avatar Body (LoRA Training) + NeuroPhoto (Image Generation)',

  /**
   * Validate configuration
   */
  async init(config: Record<string, string>) {
    logger.info('Initializing Avatar Face plugin')

    try {
      const validatedConfig = await configSchema.parseAsync(config)

      // Set environment variables
      for (const [key, value] of Object.entries(validatedConfig)) {
        if (value) {
          process.env[key] = value
        }
      }

      logger.info('Avatar Face plugin configuration validated successfully')
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.issues?.map(e => e.message)?.join(', ') || 'Unknown validation error'
        throw new Error(`Invalid plugin configuration: ${errorMessages}`)
      }
      throw new Error(`Invalid plugin configuration: ${error instanceof Error ? error.message : String(error)}`)
    }
  },

  /**
   * Plugin services
   */
  services: [AvatarFaceService],

  /**
   * Plugin actions
   */
  actions: [digitalAvatarBodyAction, neuroPhotoAction],

  /**
   * Plugin providers
   */
  providers: [avatarFaceProvider],

  /**
   * Example routes
   */
  routes: [
    {
      name: 'avatar-face-status',
      path: '/api/avatar-face/status',
      type: 'GET',
      handler: async (_req: any, res: any) => {
        res.json({
          service: 'avatar-face',
          status: 'active',
          features: [
            'Digital Avatar Body (LoRA Training)',
            'NeuroPhoto (Image Generation)',
          ],
          version: '1.0.0',
        })
      },
    },
    {
      name: 'avatar-face-models',
      path: '/api/avatar-face/models/:telegramId',
      type: 'GET',
      handler: async (req: any, res: any) => {
        const telegramId = parseInt(req.params.telegramId)

        try {
          const service = req.runtime.getService('avatar-face') as AvatarFaceService | undefined
          if (!service) {
            throw new Error('Avatar Face service not available')
          }

          const userModelService = service.getUserModelService()
          const models = await userModelService.getActiveUserModels(telegramId, req.runtime.getSetting('BOT_NAME') || 'default')

          res.json({
            success: true,
            models: models.map((model: any) => ({
              id: model.id,
              modelName: model.model_name,
              status: model.status,
              triggerWord: model.trigger_word,
              gender: model.gender,
              createdAt: model.created_at,
            })),
          })
        } catch (error) {
          res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      },
    },
  ],

  /**
   * Plugin events
   */
  events: {
    MESSAGE_RECEIVED: [
      async (_params) => {
        logger.debug('Avatar Face plugin received message')
      },
    ],
  },

  /**
   * Model handlers (placeholder)
   */
  models: {
    [ModelType.TEXT_SMALL]: async (
      _runtime,
      { prompt: _prompt, stopSequences: _stopSequences }: GenerateTextParams
    ) => {
      return 'Avatar Face plugin handles image generation, not text generation'
    },
    [ModelType.TEXT_LARGE]: async (
      _runtime,
      {
        prompt: _prompt,
        stopSequences: _stopSequences,
        maxTokens: _maxTokens = 8192,
        temperature: _temperature = 0.7,
        frequencyPenalty: _frequencyPenalty = 0.7,
        presencePenalty: _presencePenalty = 0.7,
      }: GenerateTextParams
    ) => {
      return 'Avatar Face plugin handles image generation, not text generation'
    },
  },

  /**
   * Plugin dependencies
   */
  // dependencies: ['@elizaos/plugin-telegram'],
}

export default avatarFacePlugin
