/**
 * ⚠️ DEPRECATED: Используйте централизованный сервис загрузки секретов!
 * 
 * @deprecated Этот файл устарел. Секреты должны загружаться в entrypoint.ts
 * @see packages/server/src/services/infisicalSecretLoader.ts
 * @see packages/server/src/entrypoint.ts
 * 
 * ⚠️ ВАЖНО: Этот файл оставлен только для обратной совместимости.
 * В будущем он будет удален. НЕ используйте его в новом коде!
 * 
 * Секреты загружаются централизованно в packages/server/src/entrypoint.ts
 * перед инициализацией сервера, поэтому они уже доступны через process.env
 * когда этот код выполняется.
 */

// Re-export для обратной совместимости
// В будущем этот файл будет удален
export async function loadInfisicalSecrets(): Promise<void> {
  console.warn('[INFISICAL] ⚠️  DEPRECATED: Используется устаревший метод загрузки секретов!');
  console.warn('[INFISICAL] Секреты должны загружаться централизованно в entrypoint.ts');
  console.warn('[INFISICAL] См. packages/server/src/services/infisicalSecretLoader.ts');
  
  // Секреты уже должны быть загружены в entrypoint.ts
  // Просто проверяем, что они доступны
  if (process.env.POSTGRES_URL) {
    console.log('[INFISICAL] ✅ Секреты уже загружены (POSTGRES_URL доступен)');
  } else {
    console.warn('[INFISICAL] ⚠️  POSTGRES_URL не найден. Убедитесь, что секреты загружены в entrypoint.ts');
  }
}
