import { getTelegramId } from './src/utils/getTelegramId.js';
import { getUserModelsTask } from './src/services/modelLoader.js';

// UUID из Socket.IO сообщения
const uuidFromSocketIO = 'aa7cf0e2-f10f-49dd-9ec2-0ea7befc8bcf';

// Создаём тестовое сообщение как в Socket.IO
const socketIOMessage = {
  userId: uuidFromSocketIO,
  metadata: {
    targetUserId: '13929ac6-683f-0361-89a4-dd4831f95e2d',  // UUID бота
    channelType: 'DM',
    isDm: true
  }
};

console.log('\n=== ПРОВЕРКА UUID → TELEGRAM ID ===\n');
console.log('UUID из Socket.IO:', uuidFromSocketIO);

// Получаем Telegram ID (будет хэш, т.к. нет числового ID)
const telegramId = getTelegramId(socketIOMessage);
console.log('Полученный ID (хэш UUID):', telegramId);

console.log('\n=== ПОИСК МОДЕЛЕЙ ПО ХЭШУ ===\n');
console.log(`Ищем модели для ID: ${telegramId}...`);

const modelsTask = getUserModelsTask(telegramId, 'neuro_face_bot');
const modelsResult = await modelsTask();

if (modelsResult.isLeft()) {
  console.log('\n❌ ОШИБКА:', modelsResult.value);
  process.exit(1);
}

const models = modelsResult.value;
console.log(`Найдено моделей: ${models.length}`);

if (models.length === 0) {
  console.log('\n❌ МОДЕЛИ НЕ НАЙДЕНЫ ПО ХЭШУ UUID!');
  console.log('\n=== РЕШЕНИЕ ===');
  console.log('В веб-интерфейсе нет реального Telegram ID.');
  console.log('Нужно либо:');
  console.log('1. Создать модель для веб-пользователя (хэш UUID)');
  console.log('2. Или работать только через Telegram бота с реальным ID');
  process.exit(1);
}

console.log('\n✅ МОДЕЛИ НАЙДЕНЫ!');
models.forEach((model, idx) => {
  console.log(`\n${idx + 1}. ${model.model_name}`);
  console.log(`   Trigger: ${model.trigger_word}`);
});

process.exit(0);
