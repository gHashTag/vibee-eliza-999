#!/usr/bin/env node
/**
 * Инициализация базы данных для VIBEE агента
 * Обходит проблему миграций PostgreSQL в SQLite/PGLite
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '..', '.eliza', '.elizadb', 'vibee.sqlite');

console.log('🔧 Инициализация базы данных SQLite для VIBEE...');
console.log(`📁 Путь к БД: ${DB_PATH}`);

try {
  // Создаем директорию если не существует
  const fs = await import('fs');
  const dbDir = dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log('✅ Создана директория базы данных');
  }

  // Подключаемся к базе
  const db = new Database(DB_PATH);

  // Создаем базовые таблицы для SQLite
  db.exec(`
    -- Таблица для сообщений (базовая структура)
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      user_id TEXT,
      room_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Таблица для воспоминаний агента
    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      type TEXT,
      user_id TEXT,
      room_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Таблица для комнат
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Таблица для участников
    CREATE TABLE IF NOT EXISTS participants (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      room_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Создаем индексы для производительности
    CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
    CREATE INDEX IF NOT EXISTS idx_memories_room_id ON memories(room_id);
    CREATE INDEX IF NOT EXISTS idx_participants_room_id ON participants(room_id);
  `);

  console.log('✅ Базовые таблицы созданы успешно');

  // Проверяем таблицы
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log(`📊 Создано таблиц: ${tables.length}`);
  tables.forEach(table => console.log(`   - ${table.name}`));

  db.close();
  console.log('✅ База данных инициализирована успешно!');
  process.exit(0);
} catch (error) {
  console.error('❌ Ошибка инициализации базы данных:', error);
  process.exit(1);
}
