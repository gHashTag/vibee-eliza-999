#!/usr/bin/env node

// Импортируем библиотеки
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';
import { createAvatar } from '@dicebear/core';
import { avataaars, human, identicon } from '@dicebear/collection';

// Определяем список агентов
const agents = [
  {
    id: '13929ac6-683f-0361-89a4-dd4831f95e2d',
    name: 'VIBEE',
    avatar: ''
  },
  {
    id: 'c2a4d44f-3e12-00f4-acd8-88bb3ca64e35',
    name: 'Instagram Expert',
    avatar: ''
  }
];

console.log('🎨 Генерация аватаров для агентов (v2)...');
console.log('');

// Простой генератор аватара с использованием DiceBear
async function generateAvatar(seed, style) {
  let avatar;

  switch (style) {
    case 'human':
      avatar = createAvatar(human, {
        seed: seed,
        size: 200,
        radius: 50,
        backgroundColor: ['ffd700', 'ffc700', 'ffb700', 'ffdd55', 'ffe066', 'ffed4a']
      });
      break;
    case 'identicon':
      avatar = createAvatar(identicon, {
        seed: seed,
        size: 200,
        radius: 50,
        backgroundColor: ['ffd700', 'ffc700', 'ffb700', 'ffdd55', 'ffe066', 'ffed4a']
      });
      break;
    case 'avataaars':
    default:
      avatar = createAvatar(avataaars, {
        seed: seed,
        size: 200,
        radius: 50,
        backgroundColor: ['ffd700', 'ffc700', 'ffb700', 'ffdd55', 'ffe066', 'ffed4a']
      });
      break;
  }

  return avatar.toString();
}

async function main() {
  for (const agent of agents) {
    try {
      // Генерируем аватар для агента
      const avatar = await generateAvatar(agent.id, 'avataaars');

      console.log(`✅ Аватар для ${agent.name} (ID: ${agent.id})`);
      console.log(`   Первые 100 символов: ${avatar.substring(0, 100)}...`);

      // Сохраняем аватар в файл для проверки
      const avatarPath = path.join(process.cwd(), '..', 'avatars', `${agent.id}.svg`);
      await fs.mkdir(path.dirname(avatarPath), { recursive: true });
      await fs.writeFile(avatarPath, avatar, 'utf8');

      console.log(`   Сохранен в: ${avatarPath}`);
      console.log('');
    } catch (error) {
      console.error(`❌ Ошибка при генерации аватара для ${agent.name}:`, error);
    }
  }

  console.log('🎉 Генерация аватаров завершена!');
}

main().catch(console.error);