/**
 * Преобразует ElizaOS userId (UUID) в числовой telegram_id для БД
 * Используется для веб-чата, где нет реального telegram_id
 */
export function uuidToTelegramId(userId: string): number {
  // Простой хеш UUID в число
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}
