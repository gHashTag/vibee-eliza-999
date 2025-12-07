#!/usr/bin/env node
/**
 * Простой тест GramJS для диагностики приватных сообщений
 * Запуск: node gramjs-test-simple.js
 */

const fs = require('fs');
const path = require('path');
const { TelegramClient, StringSession } = require('telegram');
const { NewMessage } = require('telegram/events');

// Попытка получить переменные из .env файла
function loadEnv() {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                const value = valueParts.join('=');
                if (!process.env[key]) {
                    process.env[key] = value;
                }
            }
        });
    }
}

// Загружаем .env
loadEnv();

console.log('🔬 GramJS Simple Test');
console.log('=' .repeat(50));

// Получаем переменные
const apiId = process.env.TELEGRAM_API_ID;
const apiHash = process.env.TELEGRAM_API_HASH;
const sessionString = process.env.TELEGRAM_SESSION_STRING;

console.log(`📱 API ID: ${apiId ? '✅' : '❌'}`);
console.log(`🔑 API Hash: ${apiHash ? '✅' : '❌'}`);
console.log(`💾 Session: ${sessionString ? '✅' : '❌'}`);

if (!apiId || !apiHash) {
    console.log('\n❌ ОШИБКА: Нужны TELEGRAM_API_ID и TELEGRAM_API_HASH');
    console.log('Проверьте файл .env или переменные окружения');
    process.exit(1);
}

// Создаем клиент
const session = new StringSession(sessionString || '');
const client = new TelegramClient(session, parseInt(apiId), apiHash, {
    connectionRetries: 5,
    deviceModel: 'Desktop',
    appVersion: '1.0.0',
    systemVersion: 'NodeJS',
    langCode: 'en'
});

async function runTest() {
    console.log('\n🔌 Подключение к Telegram...');

    try {
        await client.connect();
        console.log('✅ Подключено!');

        const me = await client.getMe();
        console.log(`\n👤 Аккаунт: @${me.username || 'без юзернейма'}`);
        console.log(`🆔 ID: ${me.id}`);

        // Счетчики
        const stats = {
            total: 0,
            private: 0,
            groups: 0,
            channels: 0
        };

        // Обработчик сообщений
        client.addEventHandler(async (event) => {
            stats.total++;

            try {
                const message = event.message;
                const chat = await message.getChat();

                // Определяем тип
                if (chat.username) {
                    // Приватный чат (пользователь с username)
                    stats.private++;
                    console.log(`\n🔒 #${stats.private} ПРИВАТНОЕ СООБЩЕНИЕ!`);
                    console.log(`   От: @${chat.username} (${chat.id})`);
                    console.log(`   Текст: ${(message.text || '').substring(0, 50)}...`);
                } else if (chat.id?.channelId) {
                    stats.channels++;
                } else if (chat.id?.chatId) {
                    stats.groups++;
                }

                console.log(`   📊 Статистика: Приватных=${stats.private}, Групп=${stats.groups}, Каналов=${stats.channels}`);

            } catch (error) {
                console.error('❌ Ошибка:', error.message);
            }
        }, new NewMessage({}));

        console.log('\n⏳ Ожидание сообщений 60 секунд...');
        console.log('Отправьте сообщение боту для тестирования\n');

        // Ждем 60 секунд
        await new Promise(resolve => setTimeout(resolve, 60000));

        console.log('\n📊 РЕЗУЛЬТАТЫ:');
        console.log('=' .repeat(50));
        console.log(`Всего сообщений: ${stats.total}`);
        console.log(`Приватных: ${stats.private}`);
        console.log(`Групповых: ${stats.groups}`);
        console.log(`Каналов: ${stats.channels}`);

        if (stats.private > 0) {
            console.log('\n✅ УСПЕХ! GramJS получает приватные сообщения');
        } else {
            console.log('\n❌ ПРОБЛЕМА! Приватные сообщения не получены');
            console.log('\nВозможные причины:');
            console.log('1. GramJS не доставляет приватные сообщения по умолчанию');
            console.log('2. Нужна специальная конфигурация');
            console.log('3. Аккаунт не может получать DM');
        }

    } catch (error) {
        console.error('\n❌ Ошибка:', error.message);
        console.error(error.stack);
    } finally {
        await client.disconnect();
        console.log('\n👋 Отключено');
    }
}

// Запускаем тест
runTest().catch(console.error);
