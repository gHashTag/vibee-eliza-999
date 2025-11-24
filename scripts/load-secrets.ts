#!/usr/bin/env bun
/**
 * Скрипт загрузки секретов из Infisical Cloud
 * Загружает все переменные из Infisical и записывает их в .env файл
 */

import { InfisicalSDK } from '@infisical/sdk';
import * as fs from 'fs';
import * as path from 'path';

// Путь к .env файлу
const envPath = path.join(process.cwd(), '.env');

// Конфигурация Infisical из .env
const infisicalConfig = {
  clientId: process.env.INFISICAL_CLIENT_ID,
  clientSecret: process.env.INFISICAL_CLIENT_SECRET,
  projectId: process.env.INFISICAL_PROJECT_ID,
  environment: process.env.INFISICAL_ENVIRONMENT || 'dev',
};

async function loadSecretsFromInfisical() {
  try {
    console.log('🔐 Подключаемся к Infisical Cloud...');
    console.log(`📦 Проект: ${infisicalConfig.projectId}`);
    console.log(`🌍 Среда: ${infisicalConfig.environment}`);

    // Инициализируем SDK Infisical с Universal Auth
    const client = new InfisicalSDK({
      siteUrl: 'https://app.infisical.com',
    });

    // Аутентифицируемся через Universal Auth
    console.log('\n🔑 Аутентифицируемся в Infisical...');
    const authenticatedClient = await client.auth().universalAuth.login({
      clientId: infisicalConfig.clientId,
      clientSecret: infisicalConfig.clientSecret,
    });

    // Получаем все секреты из Infisical
    console.log('\n📥 Получаем секреты из Infisical...');
    // Попробуем разные варианты идентификатора проекта
    let secrets;
    try {
      // Вариант 1: используем последнюю часть ID как projectSlug
      const lastPart = infisicalConfig.projectId.split('-').pop();
      console.log(`🔍 Пробуем projectSlug: ${lastPart}`);
      secrets = await authenticatedClient.secrets().listSecrets({
        environment: infisicalConfig.environment,
        projectSlug: lastPart,
      });
    } catch (error) {
      // Вариант 2: используем полный ID как workspaceId
      console.log('❌ Вариант 1 не сработал, пробуем workspaceId...');
      secrets = await authenticatedClient.secrets().listSecrets({
        environment: infisicalConfig.environment,
        workspaceId: infisicalConfig.projectId,
      });
    }

    console.log(`✅ Найдено секретов: ${secrets.secrets.length}`);

    // Читаем текущий .env файл
    let envContent = fs.readFileSync(envPath, 'utf-8');

    // Фильтруем секреты, оставляем только нужные переменные
    const importantSecrets = [
      'POSTGRES_URL',
      'OPENAI_API_KEY',
      'ANTHROPIC_API_KEY',
      'OPENROUTER_API_KEY',
      'TELEGRAM_BOT_TOKEN',
      'DISCORD_API_TOKEN',
      'GOOGLE_GENERATIVE_AI_API_KEY',
    ];

    const secretsMap = new Map<string, string>();
    for (const secret of secrets.secrets) {
      if (importantSecrets.includes(secret.secretKey)) {
        secretsMap.set(secret.secretKey, secret.secretValue);
      }
    }

    // Удаляем старые значения из .env
    for (const key of importantSecrets) {
      const regex = new RegExp(`^${key}=.*$`, 'gm');
      envContent = envContent.replace(regex, '');
    }

    // Добавляем новые значения
    let secretsSection = '\n####################################\n';
    secretsSection += '#### 🔑 СЕКРЕТЫ ИЗ INFISICAL CLOUD ####\n';
    secretsSection += '####################################\n\n';

    for (const [key, value] of secretsMap) {
      secretsSection += `${key}=${value}\n`;
    }

    // Добавляем секреты в конец файла (перед последней пустой строкой)
    envContent = envContent.replace(/\n*$/, '\n');
    envContent += secretsSection;

    // Записываем обновленный .env файл
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ Секреты успешно загружены в .env файл');
    console.log(`📝 Обновленный файл: ${envPath}`);

    // Выводим загруженные секреты (без значений)
    console.log('\n📋 Загруженные переменные:');
    for (const key of secretsMap.keys()) {
      console.log(`   - ${key}`);
    }

    console.log('\n🎉 Готово! Можно запускать приложение');

  } catch (error) {
    console.error('\n❌ Ошибка при загрузке секретов:', error);
    process.exit(1);
  }
}

// Запускаем скрипт
loadSecretsFromInfisical();
