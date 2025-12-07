/**
 * ПРОСТОЙ ТЕСТ GRAMJS
 * Проверяет базовые возможности
 */

const { TelegramClient, StringSession } = require('telegram');
const { NewMessage, Raw } = require('telegram/events');

async function testGramJS() {
    console.log('\n🔬 SIMPLE GRAMJS TEST');
    console.log('=' .repeat(60));

    const apiId = process.env.TELEGRAM_API_ID;
    const apiHash = process.env.TELEGRAM_API_HASH;
    const sessionString = process.env.TELEGRAM_SESSION_STRING;

    console.log('\n📊 Environment:');
    console.log('   API ID:', apiId ? '✅ SET' : '❌ MISSING');
    console.log('   API HASH:', apiHash ? '✅ SET' : '❌ MISSING');
    console.log('   SESSION:', sessionString ? '✅ SET' : '❌ MISSING');

    if (!apiId || !apiHash) {
        console.log('\n❌ Requires TELEGRAM_API_ID and TELEGRAM_API_HASH');
        return;
    }

    try {
        const client = new TelegramClient(
            new StringSession(sessionString || ''),
            parseInt(apiId),
            apiHash,
            {
                connectionRetries: 5,
                deviceModel: 'Test Desktop',
                appVersion: '1.0',
                systemVersion: 'NodeJS',
                langCode: 'en'
            }
        );

        console.log('\n🔌 Connecting...');
        await client.connect();
        console.log('✅ Connected!');

        const me = await client.getMe();
        console.log('\n👤 Account:', me.username || 'no username');
        console.log('   ID:', me.id);

        const stats = {
            total: 0,
            private: 0,
            group: 0,
            channel: 0,
        };

        console.log('\n📡 Setting up handlers...');

        client.addEventHandler(async (event) => {
            stats.total++;
            console.log('\n📨 Message #' + stats.total);
            
            try {
                const message = event.message;
                const sender = await message.getSender();
                
                if (event.isPrivate) {
                    stats.private++;
                    console.log('   🔒 PRIVATE from @' + (sender?.username || sender?.id));
                } else if (event.isGroup) {
                    stats.group++;
                    console.log('   👥 GROUP message');
                } else if (event.isChannel) {
                    stats.channel++;
                    console.log('   📢 CHANNEL message');
                }
            } catch (error) {
                console.error('   ❌ Error:', error.message);
            }
        }, new NewMessage({}));

        console.log('\n⏳ Waiting 30 seconds...');
        await new Promise(resolve => setTimeout(resolve, 30000));

        console.log('\n' + '=' .repeat(60));
        console.log('📊 RESULTS:');
        console.log('=' .repeat(60));
        console.log('Total messages:', stats.total);
        console.log('  Private:', stats.private);
        console.log('  Group:', stats.group);
        console.log('  Channel:', stats.channel);

        if (stats.private > 0) {
            console.log('\n✅ SUCCESS: Private messages work!');
        } else {
            console.log('\n⚠️  No private messages detected');
        }

        await client.disconnect();
        console.log('\n👋 Disconnected');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
    }
}

testGramJS();
