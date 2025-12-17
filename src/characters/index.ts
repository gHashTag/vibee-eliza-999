/**
 * Главный файл для экспорта всех персонажей VIBEE
 */

import { Character } from "@elizaos/core";
import { kolsAgentCharacter } from "./kolsAgent.character";

// Экспорт всех персонажей
export const kolsAgent = kolsAgentCharacter;

// Словарь всех персонажей для удобного доступа
export const characters: Record<string, Character> = {
  kols: kolsAgent,
};

// Экспорт по умолчанию
export default characters;
