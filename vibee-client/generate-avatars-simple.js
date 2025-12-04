#!/usr/bin/env node

// Импортируем библиотеки
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

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

console.log('🎨 Генерация аватаров для агентов...');
console.log('');

// Простой генератор аватара с использованием DiceBear
function generateAvatar(seed, style) {
  // Используем require для импорта в ES-модуле
  const Avatars = require('@dicebear/avatars').Avatars;
  const AvataaarsSprites = require('@dicebear/avatars').AvataaarsSprites;
  const HumanSprites = require('@dicebear/avatars').HumanSprites;
  const InitialsSprites = require('@dicebear/avatars').InitialsSprites;

  let sprites;
  switch (style) {
    case 'human':
      sprites = HumanSprites;
      break;
    case 'initials':
      sprites = InitialsSprites;
      break;
    case 'avataaars':
    default:
      sprites = AvataaarsSprites;
      break;
  }

  const avatars = new Avatars(sprites, {
    radius: 50,
    width: 200,
    height: 200,
    margin: 10,
    backgroundColor: ['ffd700', 'ffc700', 'ffb700', 'ffdd55', 'ffe066', 'ffed4a']
  });

  return avatars.create(seed);
}

async function main() {
  for (const agent of agents) {
    try {
      // Генерируем аватар для агента
      const avatar = generateAvatar(agent.id, 'avataaars');

      console.log(`✅ Аватар для ${agent.name} (ID: ${agent.id})`);
      console.log(`   Первые 100 символов: ${avatar.substring(0, 100)}...`);

      // Сохраняем аватар в файл для проверки
      const avatarPath = path.join(process.cwd(), '..', 'avatars', `${agent.id}.svg`);
      await fs.mkdir(path.dirname(avatarPath), { recursive: true });
      await fs.writeFile(avatarPath, avatar, 'utf8');

      // Также сохраняем в директории vibee-client для тестирования
      const clientAvatarPath = path.join(process.cwd(), 'avatars', `${agent.id}.svg`);
      await fs.mkdir(path.dirname(clientAvatarPath), { recursive: true });
      await fs.writeFile(clientAvatarPath, avatar, 'utf8');

      console.log(`   Сохранен в: ${avatarPath}`);
      console.log(`   Также сохранен в: ${clientAvatarPath}`);
      console.log('');
    } catch (error) {
      console.error(`❌ Ошибка при генерации аватара для ${agent.name}:`, error);
    }
  }

  console.log('🎉 Генерация аватаров завершена!');
}

main().catch(console.error);