// @ts-nocheck
import { IAgentRuntime } from '@elizaos/core'
import { TelegramService } from '../services/telegram.service'

/**
 * Route definition for ElizaOS plugin
 */
interface PluginRoute {
  path: string
  type: 'GET' | 'POST' | 'PUT' | 'DELETE'
  handler: (req: any, res: any) => Promise<void>
}

/**
 * Telegram API Routes
 *
 * HTTP endpoints для управления Telegram через плагин
 */
export function getTelegramRoutes(runtime: IAgentRuntime): PluginRoute[] {
  return [
    /**
     * GET /api/telegram/status
     * Статус сервиса Telegram
     */
    {
      path: '/telegram/status',
      type: 'GET' as const,
      handler: async (req: any, res: any) => {
        const service = runtime.getService<TelegramService>('telegram-craft')

        res.json({
          ok: true,
          pluginName: 'telegram-craft',
          serviceAvailable: !!service,
          timestamp: new Date().toISOString(),
        })
      },
    },

    /**
     * GET /api/telegram/dialogs
     * Получить список диалогов
     */
    {
      path: '/telegram/dialogs',
      type: 'GET' as const,
      handler: async (req: any, res: any) => {
        try {
          const limit = parseInt(req.query?.limit as string) || 20

          const service = runtime.getService<TelegramService>('telegram-craft')
          if (!service) {
            res.status(503).json({ error: 'Telegram service unavailable' })
            return
          }

          const dialogs = await service.getDialogs(limit)

          res.json({
            success: true,
            count: dialogs.length,
            dialogs,
          })
        } catch (error) {
          console.error('[Routes] Get dialogs error:', error)
          res.status(500).json({
            error: 'Failed to fetch dialogs',
            message: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      },
    },

    /**
     * POST /api/telegram/send
     * Отправить сообщение
     */
    {
      path: '/telegram/send',
      type: 'POST' as const,
      handler: async (req: any, res: any) => {
        try {
          const { chatId, text } = req.body

          if (!chatId || !text) {
            res.status(400).json({ error: 'Missing chatId or text' })
            return
          }

          const service = runtime.getService<TelegramService>('telegram-craft')
          if (!service) {
            res.status(503).json({ error: 'Telegram service unavailable' })
            return
          }

          // Используем метод sendMessage если он доступен
          const result = await (service as any).sendMessage?.(chatId, text)

          res.json({
            success: true,
            messageId: result?.id,
          })
        } catch (error) {
          console.error('[Routes] Send message error:', error)
          res.status(500).json({
            error: 'Failed to send message',
            message: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      },
    },

    /**
     * GET /api/telegram/metrics
     * Метрики плагина
     */
    {
      path: '/telegram/metrics',
      type: 'GET' as const,
      handler: async (req: any, res: any) => {
        res.json({
          ok: true,
          metrics: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString(),
          },
        })
      },
    },
  ]
}
