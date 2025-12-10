/**
 * Routes - HTTP API endpoints
 * Централизованный экспорт всех HTTP routes для plugin-telegram-craft
 */

import type { IAgentRuntime } from '@elizaos/core';
import type { Router } from 'express';
import { createChatConfigRoutes } from './chatConfigRoutes';

export { getTelegramRoutes } from './telegramRoutes';
export { createChatConfigRoutes } from './chatConfigRoutes';

/**
 * Регистрирует все routes плагина
 */
export function registerAllRoutes(router: Router, runtime: IAgentRuntime): void {
  console.log('[routes] Регистрация HTTP API routes...');

  // Chat Config routes (Strategy Management Center)
  createChatConfigRoutes(router, runtime);

  console.log('[routes] Все routes зарегистрированы');
}
