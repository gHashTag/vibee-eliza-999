#!/usr/bin/env bun
/**
 * Скрипт загрузки секретов из Infisical Cloud
 * Загружает все переменные из Infisical и записывает их в .env файл
 * ✅ С эмодзи и подробным логированием для лучшей видимости
 */

import { InfisicalSDK } from '@infisical/sdk';
import * as fs from 'fs';
import * as path from 'path';

// ANSI коды для цветного вывода
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Функция для цветного вывода
const log = {
  info: (msg: string) => console.log(`${colors.cyan}ℹ️  INFO:${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✅ SUCCESS:${colors.reset} ${msg}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠️  WARNING:${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}❌ ERROR:${colors.reset} ${msg}`),
  step: (msg: string) => console.log(`${colors.magenta}🔄 STEP:${colors.reset} ${msg}`),
  debug: (msg: string) => console.log(`${colors.blue}🐛 DEBUG:${colors.reset} ${msg}`),
};

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
    log.step('🚀 ЗАПУСК ЗАГРУЗКИ СЕКРЕТОВ ИЗ INFISICAL CLOUD');
    console.log(`${colors.bright}${colors.cyan}
╔══════════════════════════════════════════════════════════╗
║                  🔐 СИСТЕМА ЗАГРУЗКИ СЕКРЕТОВ            ║
║                    INFISICAL CLOUD                       ║
╚══════════════════════════════════════════════════════════╝
${colors.reset}`);

    // Шаг 1: Проверяем наличие конфигурационных переменных
    log.step('📋 ШАГ 1: Проверка конфигурации Infisical');
    const missingConfig: string[] = [];

    if (!infisicalConfig.clientId) {
      missingConfig.push('INFISICAL_CLIENT_ID');
    }
    if (!infisicalConfig.clientSecret) {
      missingConfig.push('INFISICAL_CLIENT_SECRET');
    }
    if (!infisicalConfig.projectId) {
      missingConfig.push('INFISICAL_PROJECT_ID');
    }

    if (missingConfig.length > 0) {
      log.error(`❌ ОТСУТСТВУЮТ КОНФИГУРАЦИОННЫЕ ПЕРЕМЕННЫЕ:`);
      missingConfig.forEach(varName => {
        log.error(`   ${colors.red}✗ ${varName}${colors.reset}`);
      });
      log.error('Проверьте .env файл!');
      process.exit(1);
    }

    log.success('✅ Все конфигурационные переменные найдены');
    log.info(`📦 Project ID: ${colors.yellow}${infisicalConfig.projectId}${colors.reset}`);
    log.info(`🌍 Environment: ${colors.yellow}${infisicalConfig.environment}${colors.reset}`);
    log.info(`🔑 Client ID: ${colors.yellow}${infisicalConfig.clientId.substring(0, 8)}...${colors.reset}`);

    // Шаг 2: Проверяем наличие .env файла
    log.step('📁 ШАГ 2: Проверка .env файла');
    if (!fs.existsSync(envPath)) {
      log.error(`❌ .env файл не найден: ${envPath}`);
      process.exit(1);
    }
    log.success(`✅ .env файл найден: ${envPath}`);

    // Шаг 3: Инициализируем SDK
    log.step('🔧 ШАГ 3: Инициализация Infisical SDK');
    const client = new InfisicalSDK({
      siteUrl: 'https://app.infisical.com',
    });
    log.success('✅ SDK инициализирован');

    // Шаг 4: Аутентификация
    log.step('🔑 ШАГ 4: Аутентификация в Infisical Cloud');
    log.info('⏳ Выполняется Universal Auth login...');

    const authenticatedClient = await client.auth().universalAuth.login({
      clientId: infisicalConfig.clientId,
      clientSecret: infisicalConfig.clientSecret,
    });

    log.success('✅ Аутентификация успешна!');

    // Шаг 5: Получение секретов
    log.step('📥 ШАГ 5: Получение секретов из Infisical');
    log.info(`🔍 Используем правильный API: secretsClient.listSecrets()`);
    log.info(`   projectId = ${infisicalConfig.projectId}`);
    log.info(`   environment = ${infisicalConfig.environment}`);

    let secrets;
    try {
      secrets = await authenticatedClient.secretsClient.listSecrets({
        environment: infisicalConfig.environment,
        projectId: infisicalConfig.projectId,
      });
      log.success(`✅ Секреты успешно получены!`);
    } catch (error: any) {
      log.error(`❌ Ошибка при получении секретов: ${error.message}`);
      throw error;
    }

    log.success(`📊 Получено секретов: ${secrets.secrets.length}`);

    // Шаг 6: Фильтрация важных секретов
    log.step('🔍 ШАГ 6: Фильтрация важных секретов');
    const importantSecrets = [
      'POSTGRES_URL',
      'OPENAI_API_KEY',
      'ANTHROPIC_API_KEY',
      'OPENROUTER_API_KEY',
      'TELEGRAM_BOT_TOKEN',
      'DISCORD_API_TOKEN',
      'GOOGLE_GENERATIVE_AI_API_KEY',
      'FAL_KEY',
      'SENTRY_DSN',
      'SENTRY_API_TOKEN',
    ];

    const secretsMap = new Map<string, string>();
    const foundSecrets: string[] = [];
    const missingSecrets: string[] = [...importantSecrets];

    for (const secret of secrets.secrets) {
      if (importantSecrets.includes(secret.secretKey)) {
        secretsMap.set(secret.secretKey, secret.secretValue);
        const index = missingSecrets.indexOf(secret.secretKey);
        if (index > -1) {
          missingSecrets.splice(index, 1);
        }
        foundSecrets.push(secret.secretKey);
      }
    }

    log.success(`🎯 Найдено важных секретов: ${foundSecrets.length}/${importantSecrets.length}`);

    if (foundSecrets.length > 0) {
      log.info(`${colors.green}✅ НАЙДЕННЫЕ СЕКРЕТЫ:${colors.reset}`);
      foundSecrets.forEach(secret => {
        log.info(`   ${colors.green}✓${colors.reset} ${secret}`);
      });
    }

    if (missingSecrets.length > 0) {
      log.warning(`${colors.yellow}⚠️  ОТСУТСТВУЮЩИЕ СЕКРЕТЫ:${colors.reset}`);
      missingSecrets.forEach(secret => {
        log.warning(`   ${colors.yellow}✗${colors.reset} ${secret}`);
      });
    }

    // Шаг 7: Обновление .env файла
    log.step('📝 ШАГ 7: Обновление .env файла');

    let envContent = fs.readFileSync(envPath, 'utf-8');
    log.info('📖 Текущий .env файл прочитан');

    // Удаляем старые значения
    log.info('🧹 Удаляем старые значения секретов...');
    for (const key of importantSecrets) {
      const regex = new RegExp(`^${key}=.*$`, 'gm');
      envContent = envContent.replace(regex, '');
    }

    // Добавляем новые значения
    let secretsSection = '\n####################################\n';
    secretsSection += '#### 🔑 СЕКРЕТЫ ИЗ INFISICAL CLOUD ####\n';
    secretsSection += '####################################\n';
    secretsSection += `# Обновлено: ${new Date().toISOString()}\n`;
    secretsSection += `# Источник: Infisical Cloud (${infisicalConfig.environment})\n\n`;

    for (const [key, value] of secretsMap) {
      // Показываем только первые и последние символы ключа для безопасности
      const maskedValue = value.length > 20
        ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
        : '***скрыто***';
      log.info(`   ${colors.cyan}→${colors.reset} ${key} = ${maskedValue}`);
      secretsSection += `${key}=${value}\n`;
    }

    // Записываем обновленный файл
    envContent = envContent.replace(/\n*$/, '\n');
    envContent += secretsSection;

    fs.writeFileSync(envPath, envContent);
    log.success(`✅ .env файл обновлен: ${envPath}`);

    // Шаг 8: Итоговая проверка
    log.step('🎉 ШАГ 8: Итоговая проверка');
    console.log(`${colors.bright}${colors.green}
╔══════════════════════════════════════════════════════════╗
║                    🎊 ЗАГРУЗКА ЗАВЕРШЕНА                ║
║                   СЕКРЕТЫ ГОТОВЫ К ИСПОЛЬЗОВАНИЮ        ║
╠══════════════════════════════════════════════════════════╣
║ ${colors.reset}✅ Загружено секретов: ${foundSecrets.length}${colors.green}
║ ⚠️  Отсутствует секретов: ${missingSecrets.length}${colors.green}
║ 📁 Файл: ${envPath}${colors.green}
╚══════════════════════════════════════════════════════════╝
${colors.reset}`);

    // Проверка критичных секретов
    const criticalSecrets = ['TELEGRAM_BOT_TOKEN', 'OPENROUTER_API_KEY', 'POSTGRES_URL'];
    const missingCritical = criticalSecrets.filter(s => !foundSecrets.includes(s));

    if (missingCritical.length > 0) {
      log.error(`${colors.red}🚨 КРИТИЧНО: Отсутствуют критичные секреты!${colors.reset}`);
      missingCritical.forEach(secret => {
        log.error(`${colors.red}   ❌ ${secret}${colors.reset}`);
      });
      log.error('Приложение может не работать корректно!');
    } else {
      log.success(`${colors.green}🎯 Все критичные секреты найдены!${colors.reset}`);
    }

    // Эмодзи верификация
    console.log(`${colors.bright}${colors.green}
    🎉 ✨ 🚀 ✅ 🎊 🔐 🔑 📦 🌟 💫 🏆 🎯 🚀 ✨ 🎉
              СИСТЕМА СЕКРЕТОВ ГОТОВА К РАБОТЕ!
    🎉 ✨ 🚀 ✅ 🎊 🔐 🔑 📦 🌟 💫 🏆 🎯 🚀 ✨ 🎉
${colors.reset}`);

  } catch (error) {
    log.error(`${colors.red}💥 КРИТИЧЕСКАЯ ОШИБКА ПРИ ЗАГРУЗКЕ СЕКРЕТОВ:${colors.reset}`);
    log.error(`${colors.red}${error}${colors.reset}`);
    console.log(`${colors.red}
╔══════════════════════════════════════════════════════════╗
║                     🚨 ОШИБКА! 🚨                       ║
║              ЗАГРУЗКА СЕКРЕТОВ НЕ УДАЛАСЬ              ║
╚══════════════════════════════════════════════════════════╝
${colors.reset}`);
    process.exit(1);
  }
}

// Запускаем скрипт
loadSecretsFromInfisical();
