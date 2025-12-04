import { drizzle as drizzleSqlite } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import * as path from 'path';

// Connect to SQLite database
const dbPath = '/Users/playra/vibee-agent/plugin-vibe-face-avatar/data/avatar-face.db';
const sqlite = new Database(dbPath);
const db = drizzleSqlite(sqlite, { schema: {} });

// Import userModels from the schema
const { userModels } = await import('/Users/playra/vibee-agent/plugin-vibe-face-avatar/src/db/schema.sqlite.ts');

// Query all models
const allModels = await db.select().from(userModels);

console.log('\n=== Все модели в базе данных ===\n');
console.log(`Всего моделей: ${allModels.length}\n`);

if (allModels.length === 0) {
  console.log('❌ База данных пуста! Нет моделей.\n');
} else {
  allModels.forEach((model, index) => {
    console.log(`📋 Модель ${index + 1}:`);
    console.log(`   ID: ${model.id}`);
    console.log(`   Telegram ID: ${model.telegram_id}`);
    console.log(`   Bot Name: ${model.bot_name}`);
    console.log(`   Model Name: ${model.model_name}`);
    console.log(`   Model URL: ${model.model_url}`);
    console.log(`   Trigger Word: ${model.trigger_word}`);
    console.log(`   Gender: ${model.gender}`);
    console.log(`   Status: ${model.status}`);
    console.log(`   Active: ${model.is_active}`);
    console.log(`   Created: ${model.created_at}\n`);
  });
}

// Look for NEURO_SAGE specifically
const neuroSageModel = allModels.find(m => m.trigger_word === 'NEURO_SAGE');
console.log('\n=== Поиск модели NEURO_SAGE ===\n');
if (neuroSageModel) {
  console.log('✅ Модель NEURO_SAGE найдена!');
  console.log(`   Telegram ID: ${neuroSageModel.telegram_id}`);
  console.log(`   Bot Name: ${neuroSageModel.bot_name}`);
  console.log(`   Status: ${neuroSageModel.status}`);
  console.log(`   Active: ${neuroSageModel.is_active}`);
  console.log(`   Model URL: ${neuroSageModel.model_url}\n`);
} else {
  console.log('❌ Модель NEURO_SAGE НЕ найдена!\n');
}

sqlite.close();
process.exit(0);
