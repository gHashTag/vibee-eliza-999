/**
 * KOLS Plugin - Целевые чаты для мониторинга и обучения
 *
 * Все целевые чаты определены в одном месте.
 * Изменения здесь автоматически применяются во всём плагине.
 */

/**
 * Идентификаторы целевых чатов для мониторинга сообщений
 * и отправки проактивных обучающих материалов
 */
export const TARGET_CHATS = [
  '2643951085',     // Основной чат обучения
  '2298297094',     // Дополнительный чат
  '-1002643951085'  // Формат с префиксом -100
] as const;

/**
 * Тип для целевого чата
 */
export type TargetChatId = typeof TARGET_CHATS[number];

/**
 * Проверяет, является ли чат личным (не группа, не канал)
 *
 * Telegram ID форматы:
 * - Пользователи: положительные 6-10 цифр (до ~2 миллиардов)
 * - Группы (supergroup): 10+ цифр без -100 (например 2643951085)
 * - Каналы: начинаются с -100
 *
 * ВАЖНО: ID > 2 миллиардов - это скорее всего группы
 */
export function isPrivateChat(chatId: string | number): boolean {
  const chatIdNum = typeof chatId === 'number' ? chatId : parseInt(String(chatId), 10);

  // Отрицательные ID - точно не личный чат
  if (chatIdNum < 0) {
    return false;
  }

  // ID пользователей обычно до 2 миллиардов
  // Supergroup ID начинаются примерно с 1 миллиарда и выше
  // Безопасный порог: если ID меньше 1.5 миллиарда - это скорее пользователь
  return chatIdNum > 0 && chatIdNum < 1500000000;
}

/**
 * Проверяет, является ли chatId целевым чатом
 * Учитывает разные форматы ID (с и без префикса -100)
 */
export function isTargetChat(chatId: string | number): boolean {
  const chatIdStr = String(chatId);

  // Прямое совпадение
  if (TARGET_CHATS.includes(chatIdStr as TargetChatId)) {
    return true;
  }

  // Проверка с нормализацией (убираем -100 префикс)
  const normalizedId = chatIdStr.replace(/^-100/, '');
  if (TARGET_CHATS.includes(normalizedId as TargetChatId)) {
    return true;
  }

  // Проверка обратная (добавляем -100 префикс)
  const withPrefix = `-100${chatIdStr}`;
  if (TARGET_CHATS.includes(withPrefix as TargetChatId)) {
    return true;
  }

  return false;
}

/**
 * Проверяет, нужно ли обрабатывать сообщение из этого чата
 * Возвращает true для:
 * - Личных чатов (всегда отвечаем в личке)
 * - Целевых групп (TARGET_CHATS)
 */
export function shouldProcessChat(chatId: string | number): boolean {
  // Личные чаты - всегда обрабатываем
  if (isPrivateChat(chatId)) {
    return true;
  }

  // Целевые группы - обрабатываем
  return isTargetChat(chatId);
}

/**
 * Возвращает все целевые чаты как массив строк
 */
export function getTargetChats(): string[] {
  return [...TARGET_CHATS];
}

/**
 * Возвращает целевые чаты как числа (для API вызовов)
 */
export function getTargetChatsAsNumbers(): number[] {
  return TARGET_CHATS.map(id => {
    // Убираем префикс -100 если есть, затем парсим
    const normalized = id.replace(/^-100/, '');
    return parseInt(normalized, 10);
  }).filter(n => !isNaN(n));
}
