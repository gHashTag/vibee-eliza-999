/**
 * Скрипт для получения Telegram Session String
 * Запуск: bun run scripts/get-session.ts
 */
import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions'
import * as readline from 'readline'

const API_ID = 94892
const API_HASH = 'cacf9ad137d228611b49b2ecc6d68d43'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer)
    })
  })
}

async function main() {
  console.log('🔐 Telegram Session Generator')
  console.log('============================\n')

  const stringSession = new StringSession('')

  const client = new TelegramClient(stringSession, API_ID, API_HASH, {
    connectionRetries: 5,
  })

  await client.start({
    phoneNumber: async () => {
      const phone = await question('📱 Введите номер телефона (например +66624014170): ')
      return phone
    },
    password: async () => {
      const pass = await question('🔑 Введите пароль 2FA (если есть, иначе Enter): ')
      return pass
    },
    phoneCode: async () => {
      const code = await question('📨 Введите код из Telegram: ')
      return code
    },
    onError: (err) => console.log('❌ Ошибка:', err),
  })

  console.log('\n✅ Авторизация успешна!')

  const sessionString = client.session.save() as string

  console.log('\n📋 Ваша SESSION STRING (скопируйте её):')
  console.log('=' .repeat(60))
  console.log(sessionString)
  console.log('=' .repeat(60))

  // Получаем информацию об аккаунте
  const me = await client.getMe()
  console.log(`\n👤 Аккаунт: ${me.firstName} ${me.lastName || ''} (@${me.username || 'no username'})`)

  await client.disconnect()
  rl.close()
}

main().catch(console.error)
