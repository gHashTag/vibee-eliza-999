/**
 * Генератор Telegram Session String для KOLS
 *
 * Запуск: npx ts-node scripts/generate-telegram-session.ts
 *
 * ВАЖНО: Аккаунт должен быть добавлен в целевые группы!
 */

import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import * as readline from 'readline';

const API_ID = 94892; // Из .env
const API_HASH = 'cacf9ad137d228611b49b2ecc6d68d43'; // Из .env

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('🔐 Генератор Telegram Session String для KOLS\n');
  console.log('⚠️  ВАЖНО: Используй аккаунт, который ДОБАВЛЕН в целевые группы!\n');

  const stringSession = new StringSession('');

  const client = new TelegramClient(stringSession, API_ID, API_HASH, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await question('📱 Введи номер телефона (например +79991234567): '),
    password: async () => await question('🔑 Введи пароль 2FA (если есть, иначе Enter): '),
    phoneCode: async () => await question('📨 Введи код из Telegram: '),
    onError: (err) => console.log('❌ Ошибка:', err),
  });

  console.log('\n✅ Успешно авторизован!');

  const sessionString = client.session.save() as unknown as string;

  console.log('\n📋 Скопируй эту строку в .env файл:\n');
  console.log('TELEGRAM_SESSION_STRING=' + sessionString);
  console.log('\n');

  // Показываем группы аккаунта
  console.log('📂 Группы этого аккаунта:');
  const dialogs = await client.getDialogs({ limit: 20 });
  for (const dialog of dialogs) {
    if (dialog.isGroup || dialog.isChannel) {
      console.log(`  - ${dialog.title} (ID: ${dialog.id})`);
    }
  }

  await client.disconnect();
  rl.close();
}

main().catch(console.error);
