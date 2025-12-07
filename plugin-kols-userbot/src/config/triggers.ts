/**
 * KOLS Plugin - Триггерные слова для активации обучения
 *
 * Все триггеры VibeCoding в одном месте.
 * Когда пользователь упоминает эти слова, KOLS активирует обучение.
 */

/**
 * Категории триггерных слов
 */
export const TRIGGER_CATEGORIES = {
  /**
   * Основные термины VibeCoding
   */
  VIBECODING: [
    'vibecoding', 'вайбкодинг', 'вайбкодер',
    'агент', 'ai-агент', 'ии-агент', 'чат-бот',
    'агентное творчество',
    'автономность', 'самостоятельность',
    'elizaos', 'элизаос',
    'промпт', 'промпт-инжиниринг', 'промптинг',
    'языковая модель', 'llm', 'большая языковая модель',
    'openrouter',
    'rag', 'эмбеддинги', 'векторная база данных',
    'flow state', 'состояние потока', 'поток', 'флоу',
    'мультиагент', 'multi-agent', 'многоагентный',
    'рой интеллект', 'swarm'
  ],

  /**
   * Программирование
   */
  PROGRAMMING: [
    'программирование', 'разработка', 'coding', 'кодинг',
    'код', 'code', 'программа', 'скрипт',
    'функция', 'method', 'метод', 'процедура',
    'переменная', 'variable', 'константа',
    'объект', 'object', 'класс', 'class',
    'массив', 'array', 'список', 'list',
    'цикл', 'loop', 'итерация',
    'условие', 'condition', 'if', 'else',
    'булево', 'boolean', 'логический',
    'api', 'sdk', 'библиотека',
    'typescript', 'javascript', 'python', 'js', 'ts',
    'git', 'github', 'контроль версий',
    'терминал', 'командная строка', 'command line',
    'бот', 'telegram бот', 'телеграм бот',
    'веб-разработка', 'web dev', 'веб'
  ],

  /**
   * Технические термины ElizaOS
   */
  TECHNICAL: [
    'плагин', 'plugin', 'сервис', 'service',
    'runtime', 'рантайм', 'окружение', 'environment',
    'база данных', 'database', 'postgresql', 'бд',
    'деплой', 'deploy', 'хостинг', 'deployment',
    'автоматизация', 'automation',
    'webhook', 'хук', 'интеграция',
    'память', 'memory', 'контекст',
    'провайдер', 'provider',
    'команда', 'action', 'экшен',
    'база знаний', 'knowledge base'
  ],

  /**
   * Специальные термины AI/ML
   */
  AI_SPECIAL: [
    'функция агента', 'agent function',
    'восприятие', 'perception',
    'цепь мыслей', 'chain of thought', 'cot',
    'тонкая настройка', 'fine-tuning',
    'токены', 'tokens', 'контекстное окно',
    'радужный мост', 'rainbow bridge',
    'проактивное обучение', 'proactive learning'
  ]
} as const;

/**
 * Все триггерные слова в одном массиве
 */
export const TRIGGER_WORDS: readonly string[] = [
  ...TRIGGER_CATEGORIES.VIBECODING,
  ...TRIGGER_CATEGORIES.PROGRAMMING,
  ...TRIGGER_CATEGORIES.TECHNICAL,
  ...TRIGGER_CATEGORIES.AI_SPECIAL
];

/**
 * Проверяет текст на наличие триггерных слов
 * @param text - текст для проверки
 * @returns true если найден хотя бы один триггер
 */
export function containsTrigger(text: string): boolean {
  const lowerText = text.toLowerCase();
  return TRIGGER_WORDS.some(trigger => lowerText.includes(trigger));
}

/**
 * Находит все триггеры в тексте
 * @param text - текст для поиска
 * @returns массив найденных триггеров
 */
export function findTriggers(text: string): string[] {
  const lowerText = text.toLowerCase();
  return TRIGGER_WORDS.filter(trigger => lowerText.includes(trigger));
}

/**
 * Определяет категорию триггера
 * @param trigger - триггерное слово
 * @returns название категории или null
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
