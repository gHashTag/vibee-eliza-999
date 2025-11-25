#!/usr/bin/env node

/**
 * Скрипт для обновления токенов VaiBee в .env файле
 * Использование: node update-vibe-tokens.js <ACCESS_TOKEN> <ACCOUNT_ID>
 */

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const accessToken = args[0];
const accountId = args[1];

if (!accessToken || !accountId) {
  console.log('\n❌ Не указаны токены!');
  console.log('\nИспользование:');
  console.log('  node update-vibe-tokens.js <ACCESS_TOKEN> <ACCOUNT_ID>\n');
  console.log('Пример:');
  console.log('  node update-vibe-tokens.js EAAHlpbRJTAsBQBSW... 17841401201538156\n');
  process.exit(1);
}

const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

// Обновляем токены
const updatedContent = envContent
  .replace(/INSTAGRAM_ACCESS_TOKEN=.*$/m, `INSTAGRAM_ACCESS_TOKEN=${accessToken}`)
  .replace(/INSTAGRAM_ACCOUNT_ID=.*$/m, `INSTAGRAM_ACCOUNT_ID=${accountId}`);

fs.writeFileSync(envPath, updatedContent, 'utf-8');

console.log('\n✅ Токены VaiBee успешно обновлены в .env файле!\n');
console.log(`📱 INSTAGRAM_ACCESS_TOKEN: ${accessToken.substring(0, 20)}...`);
console.log(`🆔 INSTAGRAM_ACCOUNT_ID: ${accountId}\n`);

console.log('🚀 Запустите E2E тест:');
console.log('   node test-instagram-e2e.js\n');

console.log('📝 Или запустите агента:');
console.log('   npm run dev\n');
