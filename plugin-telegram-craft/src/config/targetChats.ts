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
  '2643951085',     // Основной чат обучения (супергруппа)
  '2298297094'      // Дополнительный чат
] as const;
// Примечание: -1002643951085 это тот же чат что 2643951085 (Bot API формат)
// Функция isTargetChat() автоматически нормализует ID с/без префикса -100

/**
 * Тип для целевого чата
 */
export type TargetChatId = typeof TARGET_CHATS[number];

/**
 * Проверяет, является ли чат личным (не группа, не канал)
 *
 * Telegram ID форматы:
 * - Пользователи: положительные числа, обычно < 10 миллиардов
 * - Supergroups через MTProto: channelId приходит как положительное число > 1 миллиарда
 * - Supergroups через Bot API: -100XXXXXXXXXX
 * - Каналы: аналогично supergroups
 * - Обычные группы (legacy): отрицательные без -100
 *
 * Важно: через MTProto UpdateNewChannelMessage chatId приходит как
 * положительное число (например 1504590018 = супергруппа, не пользователь!)
 *
 * Эвристика: ID пользователей Telegram обычно < 10 миллиардов,
 * но channelId супергрупп тоже могут быть в этом диапазоне.
 * Надёжнее определять по типу события (UpdateNewMessage vs UpdateNewChannelMessage)
 */
export function isPrivateChat(chatId: string | number): boolean {
  const chatIdStr = String(chatId);
  const chatIdNum = typeof chatId === 'number' ? chatId : parseInt(chatIdStr, 10);

  // Отрицательные ID - это группы или каналы
  if (chatIdNum < 0) {
    return false;
  }

  // Если ID в списке целевых чатов - это группа, не личный чат
  if (TARGET_CHATS.includes(chatIdStr as TargetChatId)) {
    return false;
  }

  // Супергруппы/каналы через MTProto имеют channelId > 1 миллиарда
  // но < 10 миллиардов (формат: 1XXXXXXXXX)
  // Пользователи начинаются с меньших чисел, хотя новые могут быть большими
  // Безопасная эвристика: ID начинающиеся с 1 и имеющие 10 цифр - это каналы
  if (chatIdNum >= 1000000000 && chatIdNum < 10000000000) {
    // Проверяем первую цифру - каналы часто начинаются с 1
    const firstDigit = chatIdStr.charAt(0);
    if (firstDigit === '1' && chatIdStr.length === 10) {
      // Скорее всего это канал/супергруппа, не личный чат
      return false;
    }
  }

  // Пользователи с большими ID (> 5 миллиардов) - это реальные юзеры
  // Например 6579515876 - это точно пользователь
  if (chatIdNum > 5000000000) {
    return true;
  }

  // Маленькие положительные ID (< 1 миллиарда) - это пользователи
  if (chatIdNum > 0 && chatIdNum < 1000000000) {
    return true;
  }

  // По умолчанию не считаем личным (безопаснее)
  return false;
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
 *
 * Обрабатываем:
 * - Целевые группы из TARGET_CHATS
 * - Личные сообщения (DM) - когда chatId = userId (не группа)
 *
 * НЕ обрабатываем:
 * - Другие группы/каналы (чтобы не спамить)
 */
export function shouldProcessChat(chatId: string | number): boolean {
  // Целевые группы - обрабатываем
  if (isTargetChat(chatId)) {
    return true;
  }

  // Личные сообщения (DM) - тоже обрабатываем
  // В MTProto личный чат определяется как: chatId = userId (положительное число)
  // и НЕ является известной группой (не в TARGET_CHATS)
  if (isPrivateChat(chatId)) {
    return true;
  }

  return false;
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
