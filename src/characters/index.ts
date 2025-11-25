/**
 * Главный файл для экспорта всех персонажей VIBEE
 */

import { Character } from '@elizaos/core';
import { instagramCharacter } from './instagram';

// Экспорт всех персонажей
export const instagramExpert = instagramCharacter;

// Словарь всех персонажей для удобного доступа
export const characters: Record<string, Character> = {
  instagram: instagramExpert,
};

// Экспорт по умолчанию
export default characters;
