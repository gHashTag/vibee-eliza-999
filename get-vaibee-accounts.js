/**
 * Получение списка Instagram аккаунтов для приложения VaiBee
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;

async function getInstagramAccounts() {
  console.log('🔍 Получаем список Instagram аккаунтов для VaiBee...\n');

  if (!INSTAGRAM_ACCESS_TOKEN) {
    console.error('❌ Токен не найден в переменных окружения');
    process.exit(1);
  }

  try {
    console.log('📡 Запрашиваем список аккаунтов...');
    const url = `https://graph.facebook.com/v18.0/me/accounts?access_token=${INSTAGRAM_ACCESS_TOKEN}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error('❌ Ошибка API:', data.error);
      console.log('\n💡 Возможные причины:');
      console.log('   - Токен не подходит для этого приложения');
      console.log('   - Недостаточно прав доступа');
      console.log('   - Приложение не авторизовано');
      process.exit(1);
    }

    console.log('✅ Получен ответ от API\n');
    console.log('📋 Найденные аккаунты:\n');

    if (!data.data || data.data.length === 0) {
      console.log('⚠️ Аккаунты не найдены. Проверьте:');
      console.log('   - Правильность токена');
      console.log('   - Авторизацию приложения');
      process.exit(1);
    }

    data.data.forEach((account, index) => {
      console.log(`\n${index + 1}. ${account.name}`);
      console.log(`   ID: ${account.id}`);
      console.log(`   Категория: ${account.category || 'Не указана'}`);
      console.log(`   Статус: ${account.personal_account ? 'Личный' : 'Бизнес'}`);
    });

    console.log('\n📝 Инструкция:');
    console.log('Выберите Instagram Business аккаунт и используйте его ID в .env файле:');
    console.log('INSTAGRAM_ACCOUNT_ID=<ID_аккаунта>');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Ошибка:', error.message);
    process.exit(1);
  }
}

getInstagramAccounts();
