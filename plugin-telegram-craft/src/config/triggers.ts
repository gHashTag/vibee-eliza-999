/**
 * KOLS Plugin - Триггерные слова для активации обучения
 *
 * ВРЕМЕННО: ТОЛЬКО ОДНО ТРИГГЕРНОЕ СЛОВО ДЛЯ ТЕСТА
 */

/**
 * Категории триггерных слов
 */
export const TRIGGER_CATEGORIES = {
  /**
   * Тестовая категория
   */
  TEST: ['test', 'тест', 'проверка', 'check'],

  /**
   * P2P обмен (оставляем для примера из запроса)
   */
  P2P_EXCHANGE: ['обменник', 'обмен', 'поменять', 'бат'],

  // Остальное закомментировано для теста
  /*
  VIBECODING: [...],
  PROGRAMMING: [...],
  TECHNICAL: [...],
  AI_SPECIAL: [...],
  */
} as const;

/**
 * Все триггерные слова в одном массиве
 */
export const TRIGGER_WORDS: readonly string[] = [
  ...TRIGGER_CATEGORIES.TEST,
  ...TRIGGER_CATEGORIES.P2P_EXCHANGE // Оставляем чтобы сработал пример пользователя
];

/**
 * Проверяет текст на наличие триггерных слов
 */
export function containsTrigger(text: string): boolean {
  const lowerText = text.toLowerCase();
  return TRIGGER_WORDS.some(trigger => lowerText.includes(trigger));
}

/**
 * Находит все триггеры в тексте
 */
export function findTriggers(text: string): string[] {
  const lowerText = text.toLowerCase();
  return TRIGGER_WORDS.filter(trigger => lowerText.includes(trigger));
}

/**
 * Определяет категорию триггера
 */
export function getTriggerCategory(trigger: string): keyof typeof TRIGGER_CATEGORIES | null {
  const lowerTrigger = trigger.toLowerCase();

  for (const [category, triggers] of Object.entries(TRIGGER_CATEGORIES)) {
    if ((triggers as readonly string[]).includes(lowerTrigger)) {
      return category as keyof typeof TRIGGER_CATEGORIES;
    }
  }

  return null;
}

/**
 * Находит триггеры определённой категории в тексте
 */
export function findTriggersByCategory(text: string, category: keyof typeof TRIGGER_CATEGORIES): string[] {
  const lowerText = text.toLowerCase();
  // @ts-ignore
  const categoryTriggers = TRIGGER_CATEGORIES[category] || [];
  return categoryTriggers.filter((trigger: string) => lowerText.includes(trigger));
}

/**
 * Проверяет наличие триггеров определённой категории в тексте
 */
export function containsTriggerCategory(text: string, category: keyof typeof TRIGGER_CATEGORIES): boolean {
  const lowerText = text.toLowerCase();
  // @ts-ignore
  const categoryTriggers = TRIGGER_CATEGORIES[category] || [];
  return categoryTriggers.some((trigger: string) => lowerText.includes(trigger));
}
