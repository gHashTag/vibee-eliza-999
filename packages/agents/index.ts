import { type Character } from "@elizaos/core";
import { neuroPhotoCharacterAgent } from "./neuroPhotoCharacter";
import { instagramAgent } from "./instagram";
import { vibeeAgent } from "./vibeeAgent";
import { kolsAgent } from "./kolsAgent";

/**
 * Registry всех доступных агентов в VIBEE
 * Используется для централизованного управления агентами
 */

export const agentsRegistry: Record<string, Character> = {
  "VIBEE": vibeeAgent,
  "Нейрофото": neuroPhotoCharacterAgent,
  "Instagram Expert": instagramAgent,
  "KOLS Agent": kolsAgent,
};

/**
 * Получить агента по имени
 */
export function getAgent(agentName: string): Character | undefined {
  return agentsRegistry[agentName];
}

/**
 * Получить всех доступных агентов
 */
export function getAllAgents(): Character[] {
  return Object.values(agentsRegistry);
}

/**
 * Список всех агентов с описаниями
 */
export const agentsList = [
  {
    name: "VIBEE",
    description: "Главный AI-агент проекта VIBEE - наставник по современной разработке",
    features: [
      "Управление агентами через ElizaOS",
      "Интеграция с плагинами (Avatar Face, Instagram Expert, Telegram Craft)",
      "Радужный Мост - автономное тестирование",
      "Помощь в разработке и обучении",
    ],
    commands: [
      "/start - приветствие",
      "/agents - список агентов",
      "/create_agent - создать агента",
      "/status - статус системы",
    ],
    file: "vibeeAgent.ts",
  },
  {
    name: "Нейрофото",
    description: "Специализированный агент для создания персонажей с помощью ИИ",
    features: [
      "Обучение персональных LoRA моделей",
      "Генерация уникальных изображений персонажей",
      "Поддержка множества стилей (anime, realistic, cartoon)",
      "Интеграция с Fal.ai и Replicate API",
    ],
    commands: [
      "/face train [имя] - обучить модель",
      "/neurophoto [описание] - сгенерировать изображение",
      "/models - показать мои модели",
    ],
    file: "neuroPhotoCharacter.ts",
  },
  {
    name: "Instagram Expert",
    description: "Специализированный агент для работы с Instagram",
    features: [
      "Публикация постов в Instagram",
      "Подготовка подписей и хэштегов",
      "Мониторинг групп в Telegram",
      "Управление Instagram контентом",
    ],
    commands: [
      "/instagram пост - опубликовать пост",
      "/hashtags [тема] - получить хэштеги",
      "/schedule - запланировать публикацию",
    ],
    file: "instagram.ts",
  },
  {
    name: "KOLS Agent",
    description: "Агент для мониторинга групповых чатов в Telegram",
    features: [
      "Мониторинг групповых чатов в реальном времени",
      "Отслеживание активности участников",
      "Статистика и аналитика групп",
      "Помощь модераторам в контроле чатов",
    ],
    commands: [
      "запусти мониторинг групп - начать наблюдение",
      "добавь группу @название - добавить в мониторинг",
      "покажи группы - список мониторимых",
      "статистика мониторинга - данные о работе",
    ],
    file: "kolsAgent.ts",
  },
];

/**
 * Экспорт агентов по отдельности для удобства
 */
export { neuroPhotoCharacterAgent } from "./neuroPhotoCharacter";
export { instagramAgent } from "./instagram";
export { vibeeAgent } from "./vibeeAgent";
export { kolsAgent } from "./kolsAgent";

/**
 * Экспорт по умолчанию (все агенты)
 */
export default agentsRegistry;
