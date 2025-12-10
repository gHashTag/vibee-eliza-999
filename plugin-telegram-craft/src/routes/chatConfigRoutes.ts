/**
 * Chat Config Routes
 * HTTP API для управления конфигурациями чатов (Strategy Management Center)
 */

import type { IAgentRuntime } from '@elizaos/core';
import type { Request, Response, Router } from 'express';
import { ChatConfigService } from '../services/chatConfig.service';
import type { CreateChatConfig, UpdateChatConfig, StyleRules, SalesConfig } from '../types/chatConfig.types';

/**
 * Создать роуты для управления конфигами чатов
 */
export function createChatConfigRoutes(router: Router, runtime: IAgentRuntime): void {
  const getService = (): ChatConfigService | null => {
    return runtime.getService<ChatConfigService>('chat-config') || null;
  };

  // ============================================
  // CRUD ENDPOINTS
  // ============================================

  /**
   * GET /api/chat-configs
   * Получить список всех конфигов
   */
  router.get('/api/chat-configs', async (_req: Request, res: Response) => {
    try {
      const service = getService();
      if (!service) {
        return res.status(503).json({ error: 'ChatConfigService не инициализирован' });
      }

      const configs = await service.listConfigs();
      res.json({
        success: true,
        configs,
        total: configs.length,
      });
    } catch (error) {
      console.error('[chatConfigRoutes] GET /api/chat-configs error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * GET /api/chat-configs/stats
   * Получить статистику конфигов
   */
  router.get('/api/chat-configs/stats', async (_req: Request, res: Response) => {
    try {
      const service = getService();
      if (!service) {
        return res.status(503).json({ error: 'ChatConfigService не инициализирован' });
      }

      const stats = service.getStats();
      const configs = await service.listConfigs();

      // Расширенная статистика
      const salesModeEnabled = configs.filter(c => c.salesMode).length;
      const chatsByType = configs.reduce((acc, c) => {
        acc[c.chatType] = (acc[c.chatType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      res.json({
        success: true,
        stats: {
          ...stats,
          salesModeEnabled,
          chatsByType,
        },
      });
    } catch (error) {
      console.error('[chatConfigRoutes] GET /api/chat-configs/stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * GET /api/chat-configs/:chatId
   * Получить конфиг по chatId
   */
  router.get('/api/chat-configs/:chatId', async (req: Request, res: Response) => {
    try {
      const service = getService();
      if (!service) {
        return res.status(503).json({ error: 'ChatConfigService не инициализирован' });
      }

      const { chatId } = req.params;
      const config = await service.getConfig(chatId);

      if (!config) {
        return res.status(404).json({
          success: false,
          error: `Конфиг для чата ${chatId} не найден`,
        });
      }

      res.json({ success: true, config });
    } catch (error) {
      console.error('[chatConfigRoutes] GET /api/chat-configs/:chatId error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * POST /api/chat-configs
   * Создать новый конфиг
   */
  router.post('/api/chat-configs', async (req: Request, res: Response) => {
    try {
      const service = getService();
      if (!service) {
        return res.status(503).json({ error: 'ChatConfigService не инициализирован' });
      }

      const data = req.body as CreateChatConfig;

      // Базовая валидация
      if (!data.chatId) {
        return res.status(400).json({ error: 'chatId обязателен' });
      }

      // Проверяем что конфиг не существует
      const existing = await service.getConfig(data.chatId);
      if (existing) {
        return res.status(409).json({
          success: false,
          error: `Конфиг для чата ${data.chatId} уже существует`,
        });
      }

      const config = await service.createConfig(data);
      res.status(201).json({ success: true, config });
    } catch (error) {
      console.error('[chatConfigRoutes] POST /api/chat-configs error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * PUT /api/chat-configs/:chatId
   * Обновить конфиг
   */
  router.put('/api/chat-configs/:chatId', async (req: Request, res: Response) => {
    try {
      const service = getService();
      if (!service) {
        return res.status(503).json({ error: 'ChatConfigService не инициализирован' });
      }

      const { chatId } = req.params;
      const updates = req.body as UpdateChatConfig;

      const config = await service.updateConfig(chatId, updates);
      res.json({ success: true, config });
    } catch (error) {
      console.error('[chatConfigRoutes] PUT /api/chat-configs/:chatId error:', error);
      if ((error as Error).message.includes('не найдена')) {
        return res.status(404).json({ error: (error as Error).message });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * DELETE /api/chat-configs/:chatId
   * Удалить конфиг
   */
  router.delete('/api/chat-configs/:chatId', async (req: Request, res: Response) => {
    try {
      const service = getService();
      if (!service) {
        return res.status(503).json({ error: 'ChatConfigService не инициализирован' });
      }

      const { chatId } = req.params;
      await service.deleteConfig(chatId);
      res.json({ success: true, message: `Конфиг для чата ${chatId} удалён` });
    } catch (error) {
      console.error('[chatConfigRoutes] DELETE /api/chat-configs/:chatId error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ============================================
  // ACTIVATION ENDPOINTS
  // ============================================

  /**
   * POST /api/chat-configs/:chatId/activate
   * Активировать конфиг
   */
  router.post('/api/chat-configs/:chatId/activate', async (req: Request, res: Response) => {
    try {
      const service = getService();
      if (!service) {
        return res.status(503).json({ error: 'ChatConfigService не инициализирован' });
      }

      const { chatId } = req.params;
      const config = await service.updateConfig(chatId, { isActive: true });
      res.json({ success: true, config, message: `Чат ${chatId} активирован` });
    } catch (error) {
      console.error('[chatConfigRoutes] POST /api/chat-configs/:chatId/activate error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * POST /api/chat-configs/:chatId/deactivate
   * Деактивировать конфиг
   */
  router.post('/api/chat-configs/:chatId/deactivate', async (req: Request, res: Response) => {
    try {
      const service = getService();
      if (!service) {
        return res.status(503).json({ error: 'ChatConfigService не инициализирован' });
      }

      const { chatId } = req.params;
      const config = await service.updateConfig(chatId, { isActive: false });
      res.json({ success: true, config, message: `Чат ${chatId} деактивирован` });
    } catch (error) {
      console.error('[chatConfigRoutes] POST /api/chat-configs/:chatId/deactivate error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ============================================
  // STRATEGY ENDPOINTS
  // ============================================

  /**
   * PUT /api/chat-configs/:chatId/strategy/tone
   * Обновить tone of voice
   */
  router.put('/api/chat-configs/:chatId/strategy/tone', async (req: Request, res: Response) => {
    try {
      const service = getService();
      if (!service) {
        return res.status(503).json({ error: 'ChatConfigService не инициализирован' });
      }

      const { chatId } = req.params;
      const { language, formality, slangs, emojisAllowed, adjectives, maxResponseLength } = req.body;

      // Получаем текущий конфиг
      const current = await service.getConfig(chatId);
      if (!current) {
        return res.status(404).json({ error: `Конфиг для чата ${chatId} не найден` });
      }

      // Мержим styleRules
      const newStyleRules: StyleRules = {
        ...current.styleRules,
        ...(language && { language }),
        ...(formality && { formality }),
        ...(slangs && { slangs }),
        ...(emojisAllowed !== undefined && { emojisAllowed }),
        ...(adjectives && { adjectives }),
        ...(maxResponseLength && { maxResponseLength }),
      };

      const config = await service.updateConfig(chatId, { styleRules: newStyleRules });
      res.json({
        success: true,
        config,
        message: `Tone of voice для чата ${chatId} обновлён`,
      });
    } catch (error) {
      console.error('[chatConfigRoutes] PUT /api/chat-configs/:chatId/strategy/tone error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * PUT /api/chat-configs/:chatId/strategy/sales
   * Включить/выключить sales mode
   */
  router.put('/api/chat-configs/:chatId/strategy/sales', async (req: Request, res: Response) => {
    try {
      const service = getService();
      if (!service) {
        return res.status(503).json({ error: 'ChatConfigService не инициализирован' });
      }

      const { chatId } = req.params;
      const { enabled, productName, price, ctaTemplate, mentorContact, features, objectionHandlers } = req.body;

      // Получаем текущий конфиг
      const current = await service.getConfig(chatId);
      if (!current) {
        return res.status(404).json({ error: `Конфиг для чата ${chatId} не найден` });
      }

      const updates: UpdateChatConfig = {
        salesMode: enabled,
      };

      // Если включаем sales mode - обновляем salesConfig
      if (enabled) {
        const newSalesConfig: SalesConfig = {
          productName: productName || current.salesConfig?.productName || 'VIBEE',
          price: price || current.salesConfig?.price || '99 Stars',
          ctaTemplate: ctaTemplate || current.salesConfig?.ctaTemplate || 'Напиши мне для старта!',
          mentorContact: mentorContact || current.salesConfig?.mentorContact || '@vibee_support',
          urgencyTriggers: current.salesConfig?.urgencyTriggers || [],
          features: features || current.salesConfig?.features || [],
          objectionHandlers: objectionHandlers || current.salesConfig?.objectionHandlers || {},
        };
        updates.salesConfig = newSalesConfig;
      }

      const config = await service.updateConfig(chatId, updates);
      res.json({
        success: true,
        config,
        message: enabled
          ? `Sales mode для чата ${chatId} включён`
          : `Sales mode для чата ${chatId} выключен`,
      });
    } catch (error) {
      console.error('[chatConfigRoutes] PUT /api/chat-configs/:chatId/strategy/sales error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * PUT /api/chat-configs/:chatId/strategy/triggers
   * Обновить trigger words
   */
  router.put('/api/chat-configs/:chatId/strategy/triggers', async (req: Request, res: Response) => {
    try {
      const service = getService();
      if (!service) {
        return res.status(503).json({ error: 'ChatConfigService не инициализирован' });
      }

      const { chatId } = req.params;
      const { triggerWords, responseProbability, requireMention } = req.body;

      const updates: UpdateChatConfig = {};

      if (triggerWords !== undefined) {
        updates.triggerWords = Array.isArray(triggerWords) ? triggerWords : triggerWords.split(',').map((w: string) => w.trim());
      }

      if (responseProbability !== undefined) {
        updates.responseProbability = Math.max(0, Math.min(1, parseFloat(responseProbability)));
      }

      if (requireMention !== undefined) {
        updates.requireMention = Boolean(requireMention);
      }

      const config = await service.updateConfig(chatId, updates);
      res.json({
        success: true,
        config,
        message: `Триггеры для чата ${chatId} обновлены`,
      });
    } catch (error) {
      console.error('[chatConfigRoutes] PUT /api/chat-configs/:chatId/strategy/triggers error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * PUT /api/chat-configs/:chatId/strategy/prompt
   * Обновить system prompt
   */
  router.put('/api/chat-configs/:chatId/strategy/prompt', async (req: Request, res: Response) => {
    try {
      const service = getService();
      if (!service) {
        return res.status(503).json({ error: 'ChatConfigService не инициализирован' });
      }

      const { chatId } = req.params;
      const { systemPrompt, personaName } = req.body;

      const updates: UpdateChatConfig = {};

      if (systemPrompt) {
        updates.systemPrompt = systemPrompt;
      }

      if (personaName) {
        updates.personaName = personaName;
      }

      const config = await service.updateConfig(chatId, updates);
      res.json({
        success: true,
        config,
        message: `System prompt для чата ${chatId} обновлён`,
      });
    } catch (error) {
      console.error('[chatConfigRoutes] PUT /api/chat-configs/:chatId/strategy/prompt error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  console.log('[chatConfigRoutes] HTTP API routes зарегистрированы');
}

export default createChatConfigRoutes;
