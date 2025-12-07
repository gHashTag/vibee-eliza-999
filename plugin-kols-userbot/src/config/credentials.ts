/**
 * KOLS Plugin - Централизованное управление Telegram Credentials
 *
 * Credentials загружаются через runtime.getSetting()
 * Это стандартный способ ElizaOS для управления секретами.
 * getSetting автоматически расшифровывает зашифрованные значения.
 */

import type { IAgentRuntime } from '@elizaos/core';
import { KolsLogger } from '../utils/logger';

export interface KolsCredentials {
  apiId: number;
  apiHash: string;
  sessionString: string;
}

/**
 * Получает Telegram credentials через runtime.getSetting()
 *
 * @param runtime - ElizaOS runtime
 * @returns KolsCredentials или null если credentials не найдены
 */
export function getCredentials(runtime: IAgentRuntime): KolsCredentials | null {
  // Используем runtime.getSetting() - стандартный метод ElizaOS
  // Он автоматически расшифровывает значения и проверяет character.settings.secrets
  const apiIdStr = runtime.getSetting('TELEGRAM_API_ID');
  const apiHash = runtime.getSetting('TELEGRAM_API_HASH');
  const sessionString = runtime.getSetting('TELEGRAM_SESSION_STRING');

  KolsLogger.debug(`getSetting TELEGRAM_API_ID: ${apiIdStr}`);
  KolsLogger.debug(`getSetting TELEGRAM_API_HASH: ${apiHash ? apiHash.substring(0, 8) + '...' : 'MISSING'}`);
  KolsLogger.debug(`getSetting TELEGRAM_SESSION_STRING: ${sessionString ? sessionString.substring(0, 20) + '...' : 'MISSING'}`);

  // Валидация
  if (!apiIdStr || !apiHash || !sessionString) {
    KolsLogger.error('Отсутствуют Telegram credentials!');
    KolsLogger.error(`TELEGRAM_API_ID: ${apiIdStr ? 'OK' : 'MISSING'}`);
    KolsLogger.error(`TELEGRAM_API_HASH: ${apiHash ? 'OK' : 'MISSING'}`);
    KolsLogger.error(`TELEGRAM_SESSION_STRING: ${sessionString ? 'OK' : 'MISSING'}`);
    return null;
  }

  const apiId = parseInt(apiIdStr, 10);
  if (isNaN(apiId)) {
    KolsLogger.error(`TELEGRAM_API_ID не является числом: ${apiIdStr}`);
    return null;
  }

  KolsLogger.success(`Credentials загружены через getSetting: API_ID=${apiId}`);

  return {
    apiId,
    apiHash,
    sessionString
  };
}

/**
 * Проверяет валидность credentials без логирования ошибок
 */
export function hasValidCredentials(runtime: IAgentRuntime): boolean {
  const apiId = runtime.getSetting('TELEGRAM_API_ID');
  const apiHash = runtime.getSetting('TELEGRAM_API_HASH');
  const sessionString = runtime.getSetting('TELEGRAM_SESSION_STRING');

  return !!(apiId && apiHash && sessionString);
}
