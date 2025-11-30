/**
 * Скрипт для проверки секретов в Infisical
 */

import { loadInfisicalSecrets } from '../packages/server/src/services/infisicalSecretLoader.js';

async function checkSecrets() {
  console.log('🔍 Проверяем секреты в Infisical...\n');

  try {
    const result = await loadInfisicalSecrets();

    console.log(`✅ Загружено секретов: ${result.secretsLoaded}`);
    console.log(`✅ Статус: ${result.success ? 'УСПЕХ' : 'ОШИБКА'}\n`);

    if (result.errors.length > 0) {
      console.log('❌ Ошибки:');
      result.errors.forEach(err => console.log(`   - ${err}`));
      console.log();
    }

    console.log('🔑 Критичные секреты:');
    Object.entries(result.criticalSecrets).forEach(([key, status]) => {
      const icon = status === 'loaded' ? '✅' : status === 'missing' ? '❌' : '⚠️';
      console.log(`   ${icon} ${key}: ${status}`);
    });

    console.log('\n🌍 Все переменные окружения:');
    const envKeys = Object.keys(process.env)
      .filter(key => key.includes('API') || key.includes('KEY') || key.includes('TOKEN') || key.includes('NEON'))
      .sort();

    envKeys.forEach(key => {
      const value = process.env[key];
      const masked = value && value.length > 20
        ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
        : value || 'undefined';
      console.log(`   ${key}: ${masked}`);
    });

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

checkSecrets();
