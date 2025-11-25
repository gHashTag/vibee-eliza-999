import { type Character } from "@elizaos/core";
import { neuroPhotoCharacterAgent } from "./neuroPhotoCharacter";
import { instagramAgent } from "./instagram";

/**
 * Registry всех доступных агентов в VIBEE
 * Используется для централизованного управления агентами
 */

export const agentsRegistry: Record<string, Character> = {
  "Нейрофото": neuroPhotoCharacterAgent,
  "Instagram Expert": instagramAgent,
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
    file: "neuroPhotoCharacter.character.json",
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
    file: "instagram.character.json",
  },
];

/**
 * Экспорт агентов по отдельности для удобства
 */
export { neuroPhotoCharacterAgent } from "./neuroPhotoCharacter";
export { instagramAgent } from "./instagram";

/**
 * Экспорт по умолчанию (все агенты)
 */
export default agentsRegistry;
