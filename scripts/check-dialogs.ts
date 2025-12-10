/**
 * Скрипт для проверки диалогов userbot
 * Проверяет, является ли userbot участником целевых групп
 */
import { TelegramClient, Api } from 'telegram'
import { StringSession } from 'telegram/sessions'

const API_ID = 94892
const API_HASH = 'cacf9ad137d228611b49b2ecc6d68d43'
const SESSION_STRING = '1ApWapzMBu7_l3Ag6iecyMij5-mFLMmQvi5axSimPVoH2QcUb9FBcWJ8Sq3aqEEri2kYJKts-fd2pUYKGWNYxQ10YrBmP7oN-Yoedb1HO1VFolcvKrqFciy63SowMnk80GRLmrqQ7ZHxVmGbd0uO1NhoDG2sBuvCC_B_9CxCpHo8WBL_83yjJND0OaAvXAfedTrPWgjFUn7h_Fn_5B5GnrWsj6g-u14J26NqEqg0bwa1o9TfHTzH0A5xhnUC5-WqdcU23jq_4lfWtwiCafzWf7g16Rm3R48io53Sho2dKL8nyQeAtNWSXmBvcrSmVnfrXQz0EC0qA0XzriuXoHzE-fukmXns725g='

const TARGET_CHATS = ['2643951085', '2298297094', '4832231272']

async function main() {
  console.log('🔄 Подключаемся к Telegram...')

  const session = new StringSession(SESSION_STRING)
  const client = new TelegramClient(session, API_ID, API_HASH, {
    connectionRetries: 5,
  })

  await client.connect()
  console.log('✅ Подключено!')

  // Получаем информацию о себе
  const me = await client.getMe()
  console.log(`\n👤 Аккаунт: ${me.firstName} ${me.lastName || ''} (@${me.username || 'no username'})`)
  console.log(`   ID: ${me.id}`)

  // Получаем список диалогов
  console.log('\n📋 Получаем диалоги...')
  const dialogs = await client.getDialogs({ limit: 100 })

  console.log(`\n📊 Найдено ${dialogs.length} диалогов:\n`)

  const targetFound: string[] = []

  for (const dialog of dialogs) {
    const entity = dialog.entity
    let type = 'unknown'
    let id = ''
    let title = dialog.title || 'Unknown'

    if (entity instanceof Api.User) {
      type = 'user'
      id = entity.id.toString()
    } else if (entity instanceof Api.Chat) {
      type = 'group'
      id = entity.id.toString()
    } else if (entity instanceof Api.Channel) {
      type = entity.megagroup ? 'supergroup' : 'channel'
      id = entity.id.toString()
    }

    const isTarget = TARGET_CHATS.includes(id)
    if (isTarget) {
      targetFound.push(id)
    }

    const marker = isTarget ? '🎯 ЦЕЛЕВОЙ' : '  '
    console.log(`${marker} [${type}] ${title} (ID: ${id})`)
  }

  console.log('\n' + '='.repeat(50))
  console.log('📍 Статус целевых чатов:')

  for (const targetId of TARGET_CHATS) {
    if (targetFound.includes(targetId)) {
      console.log(`  ✅ ${targetId} - НАЙДЕН в диалогах`)
    } else {
      console.log(`  ❌ ${targetId} - НЕ НАЙДЕН (userbot не в этой группе!)`)
    }
  }

  await client.disconnect()
  console.log('\n🔌 Отключено')
}

main().catch(console.error)
