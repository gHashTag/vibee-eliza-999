import { getTelegramId } from './src/utils/getTelegramId.js';
import { getUserModelsTask } from './src/services/modelLoader.js';

// Создаём тестовое сообщение в том же формате, что и Socket.IO
const testMessage = {
  userId: 'aa7cf0e2-f10f-49dd-9ec2-0ea7befc8bcf',  // UUID сущности
  entityId: 'aa7cf0e2-f10f-49dd-9ec2-0ea7befc8bcf',
  metadata: {
    targetUserId: '1189369188',  // РЕАЛЬНЫЙ Telegram ID из БД!
    channelType: 'DM',
    isDm: true
  }
};

console.log('\n=== ТЕСТ ПОЛУЧЕНИЯ TELEGRAM ID ===\n');
console.log('Тестовое сообщение:', JSON.stringify(testMessage, null, 2));

const telegramId = getTelegramId(testMessage);
console.log('\n✅ Полученный Telegram ID:', telegramId);

if (!telegramId) {
  console.log('\n❌ ОШИБКА: Telegram ID не найден!');
  process.exit(1);
}

console.log('\n=== ТЕСТ ПОИСКА МОДЕЛЕЙ ===\n');
console.log(`Ищем модели для telegram_id: ${telegramId}, bot_name: 'neuro_face_bot'...`);

const modelsTask = getUserModelsTask(telegramId, 'neuro_face_bot');
const modelsResult = await modelsTask();

if (modelsResult.isLeft()) {
  console.log('\n❌ ОШИБКА при получении моделей:', modelsResult.value);
  process.exit(1);
}

const models = modelsResult.value;
console.log(`\n✅ Найдено моделей: ${models.length}`);

if (models.length === 0) {
  console.log('\n❌ МОДЕЛИ НЕ НАЙДЕНЫ!');
  console.log('Проблема: UUID → Telegram ID конверсия не работает или БД пуста');
  process.exit(1);
}

console.log('\n📋 Найденные модели:');
models.forEach((model, idx) => {
  console.log(`\n${idx + 1}. ${model.model_name}`);
  console.log(`   Trigger: ${model.trigger_word}`);
  console.log(`   Status: ${model.status}`);
  console.log(`   Active: ${model.is_active}`);
});

console.log('\n✅ ВСЕ ТЕСТЫ ПРОЙДЕНЫ! /neurophoto должен работать!');
process.exit(0);
