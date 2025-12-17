/**
 * Получает Telegram ID пользователя из различных источников
 * Поддерживает как реальные Telegram ID, так и UUID для веб-интерфейса
 */
export function getTelegramId(message: any): number | null {
  console.log('[getTelegramId] Input:', JSON.stringify({
    'content.metadata': message?.content?.metadata,
    'metadata': message?.metadata,
    'entityId': message?.entityId,
  }, null, 2));

  // Приоритет 0: Из content.metadata.fromId (Telegram сообщения)
  if (message?.content?.metadata?.fromId) {
    const fromId = String(message.content.metadata.fromId);
    if (/^\d+$/.test(fromId)) {
      console.log('[getTelegramId] Found fromId in content.metadata:', fromId);
      return parseInt(fromId, 10);
    }
  }

  // Приоритет 1: Из metadata.targetUserId (если есть)
  if (message?.metadata?.targetUserId && typeof message.metadata.targetUserId === 'string') {
    const targetUserId = message.metadata.targetUserId;
    // Проверяем, это UUID или числовой ID
    if (/^\d+$/.test(targetUserId)) {
      console.log('[getTelegramId] Found targetUserId:', targetUserId);
      return parseInt(targetUserId, 10);
    }
  }

  // Приоритет 2: Из senderId в metadata (если числовой)
  if (message?.metadata?.senderId && typeof message.metadata.senderId === 'string') {
    const senderId = message.metadata.senderId;
    if (/^\d+$/.test(senderId)) {
      console.log('[getTelegramId] Found senderId:', senderId);
      return parseInt(senderId, 10);
    }
  }

  // Приоритет 3: Из entityId (может содержать Telegram ID)
  if (message?.entityId && typeof message.entityId === 'string') {
    if (/^\d+$/.test(message.entityId)) {
      return parseInt(message.entityId, 10);
    }
  }

  // Приоритет 4: Fallback - используем uuidToTelegramId для веб-интерфейса
  if (message?.userId) {
    return uuidToTelegramId(message.userId);
  }

  return null;
}

/**
 * Простой хеш UUID в число (для веб-интерфейса без Telegram)
 */
function uuidToTelegramId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}
