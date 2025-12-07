/**
 * КОМПЛЕКСНОЕ ТЕСТИРОВАНИЕ GramJS API
 *
 * Этот скрипт проверяет ВСЕ возможности GramJS:
 * 1. События (Listeners) - NewMessage, Raw (UpdateShortMessage для приватных), EditedMessage и др.
 * 2. Действия (Setters) - sendMessage, editMessage, deleteMessages и др.
 * 3. Геттеры - getMe, getDialogs, getMessages и др.
 *
 * Запуск: bun run scripts/gramjs-comprehensive-test.ts
 */

import { TelegramClient, StringSession } from 'telegram';
import { NewMessage, Raw } from 'telegram/events';
import { Api } from 'telegram/tl';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// =====================================
// ТИПЫ И ИНТЕРФЕЙСЫ
// =====================================

interface TestResult {
  name: string;
  category: 'EVENT' | 'ACTION' | 'GETTER';
  status: 'PASS' | 'FAIL' | 'PENDING' | 'TIMEOUT';
  message: string;
  duration?: number;
  details?: any;
}

interface TestStats {
  newMessage: number;
  rawUpdate: number;
  updateShortMessage: number;
  updateNewMessage: number;
  editedMessage: number;
  deletedMessage: number;
  callbackQuery: number;
  userTyping: number;
  userStatus: number;
  other: number;
}

// =====================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// =====================================

const results: TestResult[] = [];
const stats: TestStats = {
  newMessage: 0,
  rawUpdate: 0,
  updateShortMessage: 0,
  updateNewMessage: 0,
  editedMessage: 0,
  deletedMessage: 0,
  callbackQuery: 0,
  userTyping: 0,
  userStatus: 0,
  other: 0,
};

let client: TelegramClient;
let myUserId: bigint;

// =====================================
// УТИЛИТЫ
// =====================================

function log(emoji: string, message: string, data?: any) {
  const timestamp = new Date().toLocaleTimeString('ru-RU');
  console.log(`[${timestamp}] ${emoji} ${message}`);
  if (data) {
    console.log('   ', JSON.stringify(data, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    , 2));
  }
}

function addResult(result: TestResult) {
  results.push(result);
  const statusEmoji = result.status === 'PASS' ? '✅' :
                      result.status === 'FAIL' ? '❌' :
                      result.status === 'TIMEOUT' ? '⏰' : '⏳';
  log(statusEmoji, `[${result.category}] ${result.name}: ${result.message}`);
}

async function getInfisicalSecrets(): Promise<{ apiId: string; apiHash: string; session: string }> {
  log('🔐', 'Получение секретов из Infisical...');

  try {
    const { stdout } = await execAsync('infisical secrets --env=dev --format=json');
    const secrets = JSON.parse(stdout);

    const apiId = secrets.find((s: any) => s.secretKey === 'TELEGRAM_API_ID')?.secretValue;
    const apiHash = secrets.find((s: any) => s.secretKey === 'TELEGRAM_API_HASH')?.secretValue;
    const session = secrets.find((s: any) => s.secretKey === 'TELEGRAM_SESSION_STRING')?.secretValue || '';

    if (!apiId || !apiHash) {
      throw new Error('TELEGRAM_API_ID или TELEGRAM_API_HASH не найдены в Infisical');
    }

    log('✅', 'Секреты получены успешно');
    return { apiId, apiHash, session };
  } catch (error: any) {
    log('❌', `Ошибка получения секретов: ${error.message}`);

    // Пробуем из ENV
    const apiId = process.env.TELEGRAM_API_ID;
    const apiHash = process.env.TELEGRAM_API_HASH;
    const session = process.env.TELEGRAM_SESSION_STRING || '';

    if (apiId && apiHash) {
      log('✅', 'Используем секреты из ENV');
      return { apiId, apiHash, session };
    }

    throw new Error('Не удалось получить Telegram credentials');
  }
}

// =====================================
// ТЕСТЫ СОБЫТИЙ (LISTENERS)
// =====================================

function setupEventListeners() {
  log('🎧', 'Настройка обработчиков событий...');

  // 1. NewMessage - стандартный обработчик
  client.addEventHandler(async (event) => {
    stats.newMessage++;
    const message = event.message;

    log('📨', `[NewMessage] Получено сообщение #${stats.newMessage}`, {
      chatId: message.peerId,
      text: message.text?.substring(0, 50),
      isPrivate: event.isPrivate,
      isGroup: event.isGroup,
      isChannel: event.isChannel,
      senderId: message.senderId?.toString(),
    });

    // Особый маркер для приватных сообщений
    if (event.isPrivate) {
      log('🔒', '>>> ПРИВАТНОЕ СООБЩЕНИЕ ЧЕРЕЗ NewMessage! <<<');
    }
  }, new NewMessage({ incoming: true, outgoing: true }));

  // 2. Raw - ВСЕ сырые MTProto updates (КРИТИЧНО для диагностики!)
  client.addEventHandler((update) => {
    stats.rawUpdate++;

    const updateType = update.constructor.name;

    // UpdateShortMessage - ПРИВАТНЫЕ сообщения!
    if (update instanceof Api.UpdateShortMessage) {
      stats.updateShortMessage++;
      log('🔥', `[Raw/UpdateShortMessage] ПРИВАТНОЕ СООБЩЕНИЕ #${stats.updateShortMessage}!`, {
        userId: update.userId?.toString(),
        message: update.message?.substring(0, 50),
        out: update.out,
        date: update.date,
      });
    }
    // UpdateNewMessage - все новые сообщения через Raw
    else if (update instanceof Api.UpdateNewMessage) {
      stats.updateNewMessage++;
      const msg = update.message;
      log('📬', `[Raw/UpdateNewMessage] Новое сообщение #${stats.updateNewMessage}`, {
        messageId: msg instanceof Api.Message ? msg.id : 'unknown',
        text: msg instanceof Api.Message ? msg.message?.substring(0, 50) : 'N/A',
      });
    }
    // UpdateUserTyping - пользователь печатает
    else if (update instanceof Api.UpdateUserTyping) {
      stats.userTyping++;
      log('⌨️', `[Raw/UpdateUserTyping] Пользователь печатает`, {
        userId: update.userId?.toString(),
      });
    }
    // UpdateUserStatus - статус онлайн
    else if (update instanceof Api.UpdateUserStatus) {
      stats.userStatus++;
      log('🟢', `[Raw/UpdateUserStatus] Изменение статуса`, {
        userId: update.userId?.toString(),
        status: update.status?.constructor.name,
      });
    }
    // UpdateEditMessage - редактирование
    else if (update instanceof Api.UpdateEditMessage || update instanceof Api.UpdateEditChannelMessage) {
      stats.editedMessage++;
      log('✏️', `[Raw/UpdateEditMessage] Сообщение отредактировано`, {
        messageId: (update.message as any)?.id,
      });
    }
    // UpdateDeleteMessages - удаление
    else if (update instanceof Api.UpdateDeleteMessages || update instanceof Api.UpdateDeleteChannelMessages) {
      stats.deletedMessage++;
      log('🗑️', `[Raw/UpdateDeleteMessages] Сообщения удалены`, {
        messageIds: (update as any).messages,
      });
    }
    // Все остальные updates
    else {
      stats.other++;
      if (stats.other <= 5) { // Логируем только первые 5 других
        log('📋', `[Raw] Другой update: ${updateType}`);
      }
    }
  }, new Raw({}));

  // 3. CallbackQuery - нажатия inline кнопок (SKIPPED - requires separate import)
  // TODO: Implement CallbackQuery test if needed
  log('⚠️', 'CallbackQuery test skipped (requires manual implementation)');

  log('✅', 'Все обработчики событий настроены');
}

// =====================================
// ТЕСТЫ ДЕЙСТВИЙ (SETTERS)
// =====================================

async function testSendMessage(): Promise<TestResult> {
  const start = Date.now();
  try {
    // Отправляем сообщение самому себе (Saved Messages)
    const result = await client.sendMessage('me', {
      message: `🧪 Тест GramJS: ${new Date().toISOString()}`,
    });

    return {
      name: 'sendMessage',
      category: 'ACTION',
      status: 'PASS',
      message: `Сообщение отправлено (ID: ${result.id})`,
      duration: Date.now() - start,
      details: { messageId: result.id },
    };
  } catch (error: any) {
    return {
      name: 'sendMessage',
      category: 'ACTION',
      status: 'FAIL',
      message: error.message,
      duration: Date.now() - start,
    };
  }
}

async function testEditMessage(): Promise<TestResult> {
  const start = Date.now();
  try {
    // Сначала отправляем сообщение
    const sent = await client.sendMessage('me', {
      message: '✏️ Это сообщение будет отредактировано...',
    });

    // Ждём немного
    await new Promise(r => setTimeout(r, 1000));

    // Редактируем
    const edited = await client.editMessage('me', {
      message: sent.id,
      text: '✅ Сообщение успешно отредактировано!',
    });

    return {
      name: 'editMessage',
      category: 'ACTION',
      status: 'PASS',
      message: `Сообщение отредактировано (ID: ${sent.id})`,
      duration: Date.now() - start,
    };
  } catch (error: any) {
    return {
      name: 'editMessage',
      category: 'ACTION',
      status: 'FAIL',
      message: error.message,
      duration: Date.now() - start,
    };
  }
}

async function testDeleteMessage(): Promise<TestResult> {
  const start = Date.now();
  try {
    // Отправляем сообщение для удаления
    const sent = await client.sendMessage('me', {
      message: '🗑️ Это сообщение будет удалено...',
    });

    await new Promise(r => setTimeout(r, 500));

    // Удаляем
    await client.deleteMessages('me', [sent.id], { revoke: true });

    return {
      name: 'deleteMessages',
      category: 'ACTION',
      status: 'PASS',
      message: `Сообщение удалено (ID: ${sent.id})`,
      duration: Date.now() - start,
    };
  } catch (error: any) {
    return {
      name: 'deleteMessages',
      category: 'ACTION',
      status: 'FAIL',
      message: error.message,
      duration: Date.now() - start,
    };
  }
}

// =====================================
// ТЕСТЫ ГЕТТЕРОВ
// =====================================

async function testGetMe(): Promise<TestResult> {
  const start = Date.now();
  try {
    const me = await client.getMe();
    myUserId = me.id;

    return {
      name: 'getMe',
      category: 'GETTER',
      status: 'PASS',
      message: `Пользователь: @${me.username} (ID: ${me.id})`,
      duration: Date.now() - start,
      details: {
        id: me.id.toString(),
        username: me.username,
        firstName: me.firstName,
        phone: me.phone,
      },
    };
  } catch (error: any) {
    return {
      name: 'getMe',
      category: 'GETTER',
      status: 'FAIL',
      message: error.message,
      duration: Date.now() - start,
    };
  }
}

async function testGetDialogs(): Promise<TestResult> {
  const start = Date.now();
  try {
    const dialogs = await client.getDialogs({ limit: 10 });

    return {
      name: 'getDialogs',
      category: 'GETTER',
      status: 'PASS',
      message: `Получено ${dialogs.length} диалогов`,
      duration: Date.now() - start,
      details: dialogs.slice(0, 3).map(d => ({
        title: d.title,
        id: d.id?.toString(),
        isChannel: d.isChannel,
        isGroup: d.isGroup,
      })),
    };
  } catch (error: any) {
    return {
      name: 'getDialogs',
      category: 'GETTER',
      status: 'FAIL',
      message: error.message,
      duration: Date.now() - start,
    };
  }
}

async function testGetMessages(): Promise<TestResult> {
  const start = Date.now();
  try {
    const messages = await client.getMessages('me', { limit: 5 });

    return {
      name: 'getMessages',
      category: 'GETTER',
      status: 'PASS',
      message: `Получено ${messages.length} сообщений из Saved Messages`,
      duration: Date.now() - start,
      details: messages.map(m => ({
        id: m.id,
        text: m.text?.substring(0, 30),
        date: m.date,
      })),
    };
  } catch (error: any) {
    return {
      name: 'getMessages',
      category: 'GETTER',
      status: 'FAIL',
      message: error.message,
      duration: Date.now() - start,
    };
  }
}

async function testGetEntity(): Promise<TestResult> {
  const start = Date.now();
  try {
    // Пробуем получить entity по username
    const entity = await client.getEntity('me');

    return {
      name: 'getEntity',
      category: 'GETTER',
      status: 'PASS',
      message: `Entity получен: ${entity.className}`,
      duration: Date.now() - start,
      details: {
        className: entity.className,
        id: (entity as any).id?.toString(),
      },
    };
  } catch (error: any) {
    return {
      name: 'getEntity',
      category: 'GETTER',
      status: 'FAIL',
      message: error.message,
      duration: Date.now() - start,
    };
  }
}

// =====================================
// ГЕНЕРАЦИЯ ОТЧЁТА
// =====================================

function generateReport() {
  console.log('\n');
  console.log('═'.repeat(70));
  console.log('📊 ИТОГОВЫЙ ОТЧЁТ ТЕСТИРОВАНИЯ GramJS API');
  console.log('═'.repeat(70));

  // Статистика событий
  console.log('\n📡 СТАТИСТИКА СОБЫТИЙ (за время теста):');
  console.log('─'.repeat(50));
  console.log(`  NewMessage events:        ${stats.newMessage}`);
  console.log(`  Raw events (всего):       ${stats.rawUpdate}`);
  console.log(`  ├─ UpdateShortMessage:    ${stats.updateShortMessage} ${stats.updateShortMessage > 0 ? '✅ ПРИВАТНЫЕ РАБОТАЮТ!' : '⚠️'}`);
  console.log(`  ├─ UpdateNewMessage:      ${stats.updateNewMessage}`);
  console.log(`  ├─ UpdateUserTyping:      ${stats.userTyping}`);
  console.log(`  ├─ UpdateUserStatus:      ${stats.userStatus}`);
  console.log(`  ├─ EditedMessage:         ${stats.editedMessage}`);
  console.log(`  ├─ DeletedMessage:        ${stats.deletedMessage}`);
  console.log(`  └─ Другие:                ${stats.other}`);
  console.log(`  CallbackQuery events:     ${stats.callbackQuery}`);

  // Результаты тестов
  console.log('\n📋 РЕЗУЛЬТАТЫ ТЕСТОВ:');
  console.log('─'.repeat(50));

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const pending = results.filter(r => r.status === 'PENDING' || r.status === 'TIMEOUT').length;

  console.log(`\n  ✅ Успешно: ${passed}  ❌ Провалено: ${failed}  ⏳ Ожидание: ${pending}\n`);

  // Таблица результатов
  console.log('┌────────────────────────┬──────────┬─────────┬────────────────────────────────────┐');
  console.log('│ Метод                  │ Категория│ Статус  │ Сообщение                          │');
  console.log('├────────────────────────┼──────────┼─────────┼────────────────────────────────────┤');

  for (const r of results) {
    const name = r.name.padEnd(22);
    const category = r.category.padEnd(8);
    const status = (r.status === 'PASS' ? '✅ PASS' :
                   r.status === 'FAIL' ? '❌ FAIL' : '⏳ WAIT').padEnd(7);
    const msg = r.message.substring(0, 34).padEnd(34);
    console.log(`│ ${name} │ ${category} │ ${status} │ ${msg} │`);
  }

  console.log('└────────────────────────┴──────────┴─────────┴────────────────────────────────────┘');

  // Выводы
  console.log('\n🎯 ВЫВОДЫ:');
  console.log('─'.repeat(50));

  if (stats.updateShortMessage > 0) {
    console.log('✅ UpdateShortMessage работает - приватные сообщения доходят через Raw!');
    console.log('   РЕКОМЕНДАЦИЯ: Использовать Raw handler для приватных сообщений');
  } else if (stats.newMessage > 0 && results.some(r => r.name === 'sendMessage' && r.status === 'PASS')) {
    console.log('⚠️ NewMessage работает, но UpdateShortMessage не зафиксирован');
    console.log('   Возможно, за время теста не было входящих приватных сообщений');
    console.log('   РЕКОМЕНДАЦИЯ: Отправить личное сообщение аккаунту и проверить логи');
  } else {
    console.log('❌ Проблема с получением событий. Проверьте:');
    console.log('   1. Правильность TELEGRAM_SESSION_STRING');
    console.log('   2. Авторизацию аккаунта');
    console.log('   3. Сетевое подключение');
  }

  console.log('\n' + '═'.repeat(70));
}

// =====================================
// ГЛАВНАЯ ФУНКЦИЯ
// =====================================

async function main() {
  console.log('═'.repeat(70));
  console.log('🔬 КОМПЛЕКСНОЕ ТЕСТИРОВАНИЕ GramJS API');
  console.log('═'.repeat(70));
  console.log('');

  try {
    // 1. Получаем credentials
    const { apiId, apiHash, session } = await getInfisicalSecrets();

    // 2. Создаём клиент
    log('🔌', 'Создание TelegramClient...');
    const stringSession = new StringSession(session);
    client = new TelegramClient(stringSession, parseInt(apiId), apiHash, {
      connectionRetries: 5,
      deviceModel: 'GramJS Test Script',
      appVersion: '1.0.0',
      systemVersion: 'NodeJS',
      langCode: 'ru',
    });

    // 3. Подключаемся
    log('🔌', 'Подключение к Telegram...');
    await client.connect();
    log('✅', 'Подключено!');

    // 4. Настраиваем обработчики событий
    setupEventListeners();

    // 5. Запускаем тесты геттеров
    log('🧪', 'Запуск тестов ГЕТТЕРОВ...');
    addResult(await testGetMe());
    addResult(await testGetDialogs());
    addResult(await testGetMessages());
    addResult(await testGetEntity());

    // 6. Запускаем тесты действий
    log('🧪', 'Запуск тестов ДЕЙСТВИЙ...');
    addResult(await testSendMessage());
    addResult(await testEditMessage());
    addResult(await testDeleteMessage());

    // 7. Ожидаем события (60 секунд)
    const waitTime = 60;
    log('⏳', `Ожидание событий ${waitTime} секунд...`);
    log('📱', 'ОТПРАВЬТЕ ЛИЧНОЕ СООБЩЕНИЕ ЭТОМУ АККАУНТУ ДЛЯ ПРОВЕРКИ ПРИВАТНЫХ СООБЩЕНИЙ!');
    log('📱', 'Также можете отправить сообщения в группы для проверки');

    await new Promise(r => setTimeout(r, waitTime * 1000));

    // 8. Генерируем отчёт
    generateReport();

    // 9. Сохраняем новую сессию (если изменилась)
    const newSession = client.session.save() as string;
    if (newSession && newSession !== session) {
      log('💾', 'Сессия обновлена. Новая строка сессии:');
      console.log(newSession);
    }

  } catch (error: any) {
    log('❌', `Критическая ошибка: ${error.message}`);
    console.error(error);
  } finally {
    // Отключаемся
    if (client) {
      await client.disconnect();
      log('👋', 'Отключено от Telegram');
    }
  }
}

// Запуск
main().catch(console.error);
