/**
 * Тест GramJS прямо в контексте агента
 * Этот скрипт тестирует возможности GramJS для получения приватных сообщений
 */

const { TelegramClient, StringSession } = require('telegram');
const { NewMessage } = require('telegram/events');

async function testGramJSInAgent() {
    console.log('\n🔬 GRAMJS TEST IN AGENT CONTEXT');
    console.log('=' .repeat(60));

    // Получаем переменные так же, как в плагине
    const apiId = process.env.TELEGRAM_API_ID;
    const apiHash = process.env.TELEGRAM_API_HASH;
    const sessionString = process.env.TELEGRAM_SESSION_STRING;

    console.log('📊 Environment Check:');
    console.log(`   TELEGRAM_API_ID: ${apiId ? '✅ SET' : '❌ MISSING'}`);
    console.log(`   TELEGRAM_API_HASH: ${apiHash ? '✅ SET' : '❌ MISSING'}`);
    console.log(`   TELEGRAM_SESSION_STRING: ${sessionString ? '✅ SET' : '❌ MISSING'}`);

    if (!apiId || !apiHash) {
        console.log('\n❌ ERROR: TELEGRAM_API_ID and TELEGRAM_API_HASH are required');
        return;
    }

    try {
        // Создаем клиент с теми же параметрами
        const session = new StringSession(sessionString || '');
        const client = new TelegramClient(session, parseInt(apiId), apiHash, {
            connectionRetries: 5,
            deviceModel: 'Desktop',
            appVersion: '1.0.0',
            systemVersion: 'NodeJS',
            langCode: 'en'
        });

        console.log('\n🔌 Connecting to Telegram via GramJS...');
        await client.connect();
        console.log('✅ Connected!');

        const me = await client.getMe();
        console.log(`\n👤 Account: @${me.username || 'no username'}`);
        console.log(`🆔 ID: ${me.id}`);

        // Статистика
        const stats = {
            total: 0,
            private: 0,
            group: 0,
            channel: 0,
            unknown: 0
        };

        console.log('\n📡 Setting up event handlers...');

        // НОВЫЙ ПОДХОД: Используем разные типы событий
        console.log('   1. NewMessage with all filters...');

        // Тест 1: Стандартный NewMessage
        client.addEventHandler(async (event) => {
            stats.total++;
            try {
                const message = event.message;
                const chat = await message.getChat();
                const sender = await message.getSender();

                let type = 'unknown';
                if (chat.username) {
                    // Пользователь с username = приватный чат
                    type = 'private';
                    stats.private++;
                    console.log(`\n🔒 PRIVATE MESSAGE #${stats.private}`);
                    console.log(`   👤 From: @${chat.username} (ID: ${chat.id})`);
                    console.log(`   💬 Text: ${(message.text || '').substring(0, 80)}...`);
                } else if (chat.id?.channelId) {
                    type = 'channel';
                    stats.channel++;
                } else if (chat.id?.chatId) {
                    type = 'group';
                    stats.group++;
                }

                console.log(`   📊 Type: ${type}, Total: ${stats.total}, Private: ${stats.private}`);

            } catch (error) {
                console.error('   ❌ Error processing:', error.message);
            }
        }, new NewMessage({}));

        console.log('\n⏳ Waiting for messages (90 seconds)...');
        console.log('   Please send a PRIVATE MESSAGE to the bot now!');
        console.log('   Or send messages in groups to test detection\n');

        // Ждем 90 секунд
        await new Promise(resolve => setTimeout(resolve, 90000));

        console.log('\n' + '=' .repeat(60));
        console.log('📊 FINAL RESULTS:');
        console.log('=' .repeat(60));
        console.log(`Total messages received: ${stats.total}`);
        console.log(`Private messages: ${stats.private}`);
        console.log(`Group messages: ${stats.group}`);
        console.log(`Channel messages: ${stats.channel}`);
        console.log(`Unknown: ${stats.unknown}`);

        if (stats.private > 0) {
            console.log('\n✅ SUCCESS! GramJS receives private messages!');
            console.log('   The issue is in the plugin filter logic');
        } else {
            console.log('\n❌ PROBLEM: No private messages detected');
            console.log('\nPossible causes:');
            console.log('1. GramJS does not deliver private messages by default');
            console.log('2. Need special configuration');
            console.log('3. Account restrictions');
            console.log('4. Privacy settings blocking DMs');
        }

        await client.disconnect();
        console.log('\n👋 Disconnected from Telegram');

    } catch (error) {
        console.error('\n❌ CRITICAL ERROR:', error.message);
        console.error(error.stack);
    }
}

// Экспортируем для использования в агенте
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testGramJSInAgent };
}

// Запускаем тест
if (require.main === module) {
    testGramJSInAgent();
}
