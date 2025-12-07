#!/usr/bin/env node
/**
 * GramJS Test Script - Проверка получения приватных сообщений
 * Этот скрипт тестирует различные возможности GramJS для получения сообщений
 */

const { TelegramClient, StringSession, Api } = require('telegram');
const { NewMessage } = require('telegram/events');
const { Telegram } = require('telegram');

// Конфигурация
const session = new StringSession(process.env.TELEGRAM_SESSION_STRING || '');
const apiId = parseInt(process.env.TELEGRAM_API_ID || '0');
const apiHash = process.env.TELEGRAM_API_HASH || '';

if (!apiId || !apiHash) {
    console.error('❌ Нужны TELEGRAM_API_ID и TELEGRAM_API_HASH');
    process.exit(1);
}

console.log('🔬 GramJS Test Script');
console.log('=' .repeat(50));
console.log(`📱 API ID: ${apiId}`);
console.log(`🔑 API Hash: ${apiHash.substring(0, 8)}...`);
console.log(`💾 Session: ${session ? 'ЕСТЬ' : 'НЕТ'}`);
console.log('=' .repeat(50));

// Создаем клиент
const client = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 5,
    deviceModel: 'Desktop',
    appVersion: '1.0.0',
    systemVersion: 'NodeJS',
    langCode: 'en'
});

// Подсчеты различных типов сообщений
const stats = {
    total: 0,
    private: 0,
    group: 0,
    channel: 0,
    unknown: 0,
    lastMessageType: null
};

async function testConnection() {
    console.log('\n🔌 Тестирование подключения...');
    try {
        await client.connect();
        console.log('✅ Подключение успешно!');

        const me = await client.getMe();
        console.log(`👤 Пользователь: @${me.username || 'без юзернейма'}`);
        console.log(`🆔 ID: ${me.id}`);

        return true;
    } catch (error) {
        console.error('❌ Ошибка подключения:', error.message);
        return false;
    }
}

async function testDialogs() {
    console.log('\n📋 Получение списка диалогов...');
    try {
        const dialogs = await client.getDialogs({ limit: 20 });
        console.log(`📊 Найдено диалогов: ${dialogs.length}`);

        const types = { private: 0, group: 0, channel: 0 };
        dialogs.forEach(dialog => {
            if (dialog.isUser) types.private++;
            else if (dialog.isChannel) types.channel++;
            else if (dialog.isGroup) types.group++;
        });

        console.log(`💬 Приватных: ${types.private}`);
        console.log(`👥 Групповых: ${types.group}`);
        console.log(`📢 Каналов: ${types.channel}`);

        return dialogs;
    } catch (error) {
        console.error('❌ Ошибка получения диалогов:', error.message);
        return [];
    }
}

async function testEventTypes() {
    console.log('\n🎧 Тестирование различных типов событий...');

    // Счетчики для разных типов событий
    const eventCounts = {
        NewMessage: 0,
        MessageDeleted: 0,
        MessageEdited: 0,
        Typing: 0,
        CallbackQuery: 0
    };

    // Обработчик новых сообщений
    client.addEventHandler(async (event) => {
        eventCounts.NewMessage++;
        stats.total++;

        try {
            const message = event.message;
            const chat = await message.getChat();
            const sender = await message.getSender();

            // Определяем тип чата
            let messageType = 'unknown';
            if (chat.username) {
                messageType = 'private';
                stats.private++;
            } else if (chat.id?.channelId) {
                messageType = 'channel';
                stats.channel++;
            } else if (chat.id?.chatId) {
                messageType = 'group';
                stats.group++;
            }

            stats.lastMessageType = messageType;

            console.log(`\n📨 Сообщение #${eventCounts.NewMessage}`);
            console.log(`   Тип: ${messageType}`);
            console.log(`   Чат: ${chat.title || chat.firstName || 'Unknown'}`);
            console.log(`   Отправитель: ${sender?.firstName || sender?.username || 'Unknown'}`);
            console.log(`   Текст: ${(message.text || '').substring(0, 50)}...`);

            if (messageType === 'private') {
                console.log('   🔒 ПРИВАТНОЕ СООБЩЕНИЕ ОБНАРУЖЕНО!');
            }

        } catch (error) {
            console.error('❌ Ошибка обработки сообщения:', error.message);
        }
    }, new NewMessage({}));

    console.log('⏳ Ожидаю сообщения (30 секунд)...');
    console.log('   Отправьте сообщение в любой чат для тестирования');
    console.log('   Или отправьте приватное сообщение боту\n');

    // Ждем 30 секунд
    await new Promise(resolve => setTimeout(resolve, 30000));

    console.log('\n📊 ИТОГИ ТЕСТИРОВАНИЯ:');
    console.log('=' .repeat(50));
    console.log(`Всего сообщений: ${stats.total}`);
    console.log(`Приватных: ${stats.private}`);
    console.log(`Групповых: ${stats.group}`);
    console.log(`Каналов: ${stats.channel}`);
    console.log(`Неизвестных: ${stats.unknown}`);

    if (stats.private > 0) {
        console.log('\n✅ ПРИВАТНЫЕ СООБЩЕНИЯ РАБОТАЮТ!');
    } else {
        console.log('\n⚠️ ПРИВАТНЫЕ СООБЩЕНИЯ НЕ ОБНАРУЖЕНЫ');
        console.log('   Возможные причины:');
        console.log('   1. GramJS не получает приватные сообщения по умолчанию');
        console.log('   2. Нужны специальные настройки');
        console.log('   3. Аккаунт не может получать DM');
    }
}

async function testGetMessages() {
    console.log('\n🔍 Тест метода getMessages...');
    try {
        // Попробуем получить сообщения из разных источников
        const me = await client.getMe();

        // Получаем собственные сообщения (медиа с сохраненными сообщениями)
        console.log('📥 Получение собственных сообщений...');
        const myMessages = await client.getMessages('me', { limit: 10 });
        console.log(`✅ Получено собственных сообщений: ${myMessages.length}`);

        // Если есть диалоги, пробуем получить из первого
        console.log('\n📋 Получение сообщений из диалогов...');
        const dialogs = await client.getDialogs({ limit: 5 });
        if (dialogs.length > 0) {
            const firstDialog = dialogs[0];
            console.log(`   Чат: ${firstDialog.name || 'Unknown'}`);
            const messages = await client.getMessages(firstDialog, { limit: 5 });
            console.log(`✅ Получено сообщений: ${messages.length}`);
        }

    } catch (error) {
        console.error('❌ Ошибка:', error.message);
    }
}

async function runTests() {
    console.time('🕐 Общее время выполнения');

    try {
        // Тест 1: Подключение
        const connected = await testConnection();
        if (!connected) {
            console.log('\n❌ Не удалось подключиться, останавливаем тесты');
            process.exit(1);
        }

        // Тест 2: Диалоги
        await testDialogs();

        // Тест 3: Получение сообщений
        await testGetMessages();

        // Тест 4: События
        await testEventTypes();

        console.timeEnd('🕐 Общее время выполнения');
        console.log('\n🎉 Тестирование завершено!');

    } catch (error) {
        console.error('\n❌ Критическая ошибка:', error);
        console.error(error.stack);
    } finally {
        await client.disconnect();
        console.log('👋 Отключен от Telegram');
    }
}

// Запуск тестов
console.log('🚀 Запуск тестов GramJS...\n');
runTests().catch(error => {
    console.error('💥 Фатальная ошибка:', error);
    process.exit(1);
});
