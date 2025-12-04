import { drizzle as drizzleSqlite } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import { sql } from 'drizzle-orm';

// Connect to SQLite database
const dbPath = '/Users/playra/vibee-agent/plugin-vibe-face-avatar/data/avatar-face.db';
const sqlite = new Database(dbPath);
const db = drizzleSqlite(sqlite, { schema: {} });

// Import schema
const { userModels } = await import('./src/db/schema.sqlite.ts');

console.log('\n=== ДОБАВЛЕНИЕ entity_id К СУЩЕСТВУЮЩИМ МОДЕЛЯМ ===\n');

try {
  // Add entity_id column if it doesn't exist (SQLite supports adding columns)
  console.log('1. Добавляем столбец entity_id...');

  // SQLite ALTER TABLE ADD COLUMN doesn't support direct JSON, so we'll use text
  await sqlite.exec(`
    ALTER TABLE user_models ADD COLUMN entity_id TEXT;
  `);
  console.log('✅ Столбец entity_id добавлен');

  // Get all models
  console.log('\n2. Получаем список моделей...');
  const allModels = await db.select().from(userModels);

  console.log(`Найдено моделей: ${allModels.length}`);

  // For models with telegram_id 1189369188, add corresponding entity_id
  const targetModels = allModels.filter(m => m.telegram_id === 1189369188);

  console.log(`\n3. Обновляем модели с telegram_id = 1189369188...`);
  console.log(`Количество моделей для обновления: ${targetModels.length}`);

  if (targetModels.length > 0) {
    const entityId = 'aa7cf0e2-f10f-49dd-9ec2-0ea7befc8bcf';

    // Update each model
    for (const model of targetModels) {
      console.log(`\n   Обновляем модель: ${model.model_name} (ID: ${model.id})`);
      console.log(`   telegram_id: ${model.telegram_id} → добавляем entity_id: ${entityId}`);

      await db
        .update(userModels)
        .set({
          entity_id: entityId,
          updated_at: sql`(datetime('now'))`
        })
        .where(sql`id = ${model.id}`);
    }

    console.log('\n✅ Все модели обновлены!');
  } else {
    console.log('ℹ️  Модели с telegram_id = 1189369188 не найдены');
  }

  // Verify changes
  console.log('\n4. Проверяем изменения...');
  const updatedModels = await db
    .select()
    .from(userModels)
    .where(sql`telegram_id = 1189369188`);

  console.log(`\nМодели с telegram_id = 1189369188:`);
  updatedModels.forEach((model, idx) => {
    console.log(`\n${idx + 1}. ${model.model_name}`);
    console.log(`   telegram_id: ${model.telegram_id}`);
    console.log(`   entity_id: ${model.entity_id || 'НЕ УСТАНОВЛЕН'}`);
    console.log(`   status: ${model.status}`);
  });

  console.log('\n✅ ОПЕРАЦИЯ ЗАВЕРШЕНА УСПЕШНО!');

} catch (error) {
  console.error('\n❌ ОШИБКА:', error);

  if (error instanceof Error) {
    if (error.message.includes('duplicate column name')) {
      console.log('\nℹ️  Столбец entity_id уже существует. Это нормально.');
    } else {
      throw error;
    }
  }
} finally {
  sqlite.close();
}

process.exit(0);
