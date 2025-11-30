#!/usr/bin/env bun
/**
 * Тестовый скрипт для проверки загрузки POSTGRES_URL из Infisical
 * и подключения к базе данных
 */

import { InfisicalSDK } from '@infisical/sdk';
import { Pool } from 'pg';

async function testInfisicalPostgres() {
  console.log('🧪 ТЕСТИРОВАНИЕ ЗАГРУЗКИ POSTGRES_URL ИЗ INFISICAL\n');

  // Шаг 1: Проверяем конфигурацию Infisical
  const clientId = process.env.INFISICAL_CLIENT_ID;
  const clientSecret = process.env.INFISICAL_CLIENT_SECRET;
  const projectId = process.env.INFISICAL_PROJECT_ID;
  const environment = process.env.INFISICAL_ENVIRONMENT || 'dev';

  console.log('📋 Конфигурация Infisical:');
  console.log(`   INFISICAL_CLIENT_ID: ${clientId ? '✅ SET' : '❌ NOT SET'}`);
  console.log(`   INFISICAL_CLIENT_SECRET: ${clientSecret ? '✅ SET' : '❌ NOT SET'}`);
  console.log(`   INFISICAL_PROJECT_ID: ${projectId || '❌ NOT SET'}`);
  console.log(`   INFISICAL_ENVIRONMENT: ${environment}\n`);

  if (!clientId || !clientSecret || !projectId) {
    console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: Конфигурация Infisical неполная!');
    process.exit(1);
  }

  // Шаг 2: Загружаем секреты из Infisical
  console.log('🔐 Загрузка секретов из Infisical Cloud...');
  try {
    const client = new InfisicalSDK({
      siteUrl: 'https://app.infisical.com',
    });

    const authenticatedClient = await client.auth().universalAuth.login({
      clientId,
      clientSecret,
    });

    console.log('✅ Аутентификация успешна!\n');

    const secrets = await (authenticatedClient as any).secretsClient.listSecrets({
      projectId,
      environment,
    });

    console.log(`📊 Получено секретов: ${secrets.secrets.length}\n`);

    // Ищем POSTGRES_URL
    let postgresUrl: string | null = null;
    for (const secret of secrets.secrets) {
      if (secret.secretKey === 'POSTGRES_URL') {
        postgresUrl = secret.secretValue;
        break;
      }
    }

    if (!postgresUrl || postgresUrl.trim() === '') {
      console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: POSTGRES_URL не найден в секретах Infisical!');
      console.error(`   Environment: ${environment}`);
      console.error(`   Project ID: ${projectId}`);
      console.error('\n💡 Проверьте:');
      console.error('   1. POSTGRES_URL установлен в Infisical Cloud');
      console.error(`   2. Правильный environment: ${environment}`);
      console.error(`   3. Правильный Project ID: ${projectId}`);
      process.exit(1);
    }

    // Очищаем URL от возможных невидимых символов
    postgresUrl = postgresUrl.trim().replace(/\s+/g, '');

    // Показываем маскированный URL
    const urlParts = postgresUrl.split('@');
    if (urlParts.length > 1) {
      const maskedUrl = `postgresql://***@${urlParts[1]}`;
      console.log(`✅ POSTGRES_URL найден: ${maskedUrl}`);
    } else {
      console.log(`✅ POSTGRES_URL найден (длина: ${postgresUrl.length} символов)`);
    }

    // Диагностика: показываем первые и последние символы
    console.log(`\n🔍 Диагностика URL:`);
    console.log(`   Длина: ${postgresUrl.length} символов`);
    console.log(`   Начинается с: "${postgresUrl.substring(0, 20)}..."`);
    console.log(`   Заканчивается на: "...${postgresUrl.substring(postgresUrl.length - 20)}"`);
    console.log(`   Содержит переносы строк: ${postgresUrl.includes('\n') || postgresUrl.includes('\r') ? 'ДА ❌' : 'НЕТ ✅'}`);
    console.log(`   Содержит пробелы: ${postgresUrl.includes(' ') ? 'ДА ❌' : 'НЕТ ✅'}`);

    // Парсим URL для диагностики
    try {
      const url = new URL(postgresUrl);
      console.log(`\n📋 Детали подключения:`);
      console.log(`   Хост: ${url.hostname}`);
      console.log(`   Порт: ${url.port || '5432 (по умолчанию)'}`);
      console.log(`   База данных: ${url.pathname.substring(1)}`);
      console.log(`   SSL: ${url.searchParams.get('sslmode') || 'не указан'}\n`);
    } catch (e: any) {
      console.error(`\n❌ Ошибка парсинга POSTGRES_URL:`);
      console.error(`   ${e.message}`);
      console.error(`\n💡 Возможные проблемы:`);
      console.error(`   1. URL содержит невидимые символы (переносы строк, пробелы)`);
      console.error(`   2. URL неправильно отформатирован`);
      console.error(`   3. URL поврежден при сохранении в Infisical\n`);
      
      // Показываем hex-дамп первых 100 символов для диагностики
      console.log(`🔍 Hex-дамп первых 100 символов:`);
      const hexDump = postgresUrl.substring(0, 100).split('').map(c => {
        const code = c.charCodeAt(0);
        return code < 32 || code > 126 ? `\\x${code.toString(16).padStart(2, '0')}` : c;
      }).join('');
      console.log(`   ${hexDump}\n`);
    }

    // Шаг 3: Тестируем подключение к базе данных
    console.log('🗄️ Тестирование подключения к базе данных...');
    try {
      const pool = new Pool({
        connectionString: postgresUrl,
        max: 1,
        connectionTimeoutMillis: 5000,
      });

      const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
      console.log('✅ Подключение успешно!');
      console.log(`   Текущее время: ${result.rows[0].current_time}`);
      console.log(`   Версия БД: ${result.rows[0].db_version.split(' ').slice(0, 2).join(' ')}\n`);

      await pool.end();
      console.log('🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!\n');
    } catch (error: any) {
      console.error('❌ ОШИБКА ПОДКЛЮЧЕНИЯ К БАЗЕ ДАННЫХ:');
      console.error(`   Сообщение: ${error.message}`);
      console.error(`   Код: ${error.code || 'N/A'}`);
      console.error(`   Хост: ${error.hostname || 'N/A'}`);
      console.error(`   Порт: ${error.port || 'N/A'}\n`);

      if (error.code === 'ECONNREFUSED') {
        console.error('💡 Возможные причины ECONNREFUSED:');
        console.error('   1. База данных недоступна из вашей сети');
        console.error('   2. Неправильный хост или порт в POSTGRES_URL');
        console.error('   3. Файрвол блокирует подключение');
        console.error('   4. База данных не запущена\n');
      } else if (error.code === 'ENOTFOUND') {
        console.error('💡 Возможные причины ENOTFOUND:');
        console.error('   1. Неправильное имя хоста в POSTGRES_URL');
        console.error('   2. Проблемы с DNS\n');
      } else if (error.code === 'ETIMEDOUT') {
        console.error('💡 Возможные причины ETIMEDOUT:');
        console.error('   1. База данных недоступна');
        console.error('   2. Проблемы с сетью');
        console.error('   3. Файрвол блокирует подключение\n');
      }

      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ ОШИБКА ЗАГРУЗКИ СЕКРЕТОВ:');
    console.error(`   Сообщение: ${error.message}`);
    console.error(`   Стек: ${error.stack}\n`);
    process.exit(1);
  }
}

// Запускаем тест
testInfisicalPostgres().catch((error) => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
});

