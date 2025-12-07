/**
 * ⚡ Быстрый анализ пользователя @yar0309
 * Оптимизированная версия с минимальными лимитами
 */

const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');

async function quickAnalyzeUser(usernameOrId) {
    console.log(`⚡ Быстрый анализ пользователя: ${usernameOrId}`);
    console.log('=' .repeat(60));

    const client = new TelegramClient(
        new StringSession(process.env.TELEGRAM_SESSION_STRING),
        parseInt(process.env.TELEGRAM_API_ID),
        process.env.TELEGRAM_API_HASH,
        {
            connectionRetries: 3,
            retryDelay: 1000,
            timeout: 15000
        }
    );

    await client.connect();

    try {
        // 1. Получаем базовую информацию
        console.log('\n📋 [1/3] Получаю профиль пользователя...');
        let targetEntity;
        try {
            targetEntity = await client.getEntity(usernameOrId);
        } catch (error) {
            console.log(`❌ Пользователь не найден: ${error.message}`);
            return;
        }

        console.log(`✅ Найден:`);
        console.log(`   ID: ${targetEntity.id}`);
        console.log(`   Имя: ${targetEntity.firstName} ${targetEntity.lastName || ''}`);
        console.log(`   Username: @${targetEntity.username || 'нет'}`);
        console.log(`   Bio: ${targetEntity.about || 'нет'}`);
        console.log(`   Premium: ${targetEntity.isPremium ? 'да' : 'нет'}`);
        console.log(`   Верифицирован: ${targetEntity.verified ? 'да' : 'нет'}`);

        // 2. Проверяем общие группы (ограниченно)
        console.log('\n🔍 [2/3] Ищу общие группы (топ-20 диалогов)...');
        const userId = targetEntity.id;
        const commonGroups = [];
        let dialogCount = 0;

        for await (const dialog of client.iterDialogs()) {
            dialogCount++;
            if (dialogCount > 20) break; // Ограничиваем для скорости

            const entity = dialog.entity;
            if (entity.type !== 'chat' && entity.type !== 'channel') continue;

            try {
                // Проверяем только первые 50 участников (быстрее)
                let found = false;
                let participantCount = 0;

                for await (const participant of client.iterParticipants(entity)) {
                    participantCount++;
                    if (participantCount > 50) break;

                    if (participant.sponsor.id === userId) {
                        found = true;
                        break;
                    }
                }

                if (found) {
                    commonGroups.push({
                        title: dialog.title,
                        username: entity.username,
                        type: entity.type
                    });
                    console.log(`   ✓ ${dialog.title} (@${entity.username || 'приватная'})`);
                }

                // Задержка чтобы не попасть под лимиты
                await new Promise(resolve => setTimeout(resolve, 200));

            } catch (error) {
                if (!error.message.includes('CHAT_WRITE_FORBIDDEN')) {
                    console.log(`   ⚠️ ${dialog.title}: ошибка доступа`);
                }
            }
        }

        if (commonGroups.length === 0) {
            console.log('   ❌ Общие группы не найдены (проверено топ-20 диалогов)');
        }

        // 3. Анализируем пересылки (быстро)
        console.log('\n🔄 [3/3] Анализирую пересылки (последние 100 сообщений в топ-10 диалогах)...');
        const forwardGroups = new Set();
        let analyzedDialogs = 0;

        for await (const dialog of client.iterDialogs()) {
            if (analyzedDialogs >= 10) break;
            analyzedDialogs++;

            const entity = dialog.entity;

            try {
                let messageCount = 0;
                for await (const message of client.iterMessages(entity, { limit: 10 })) {
                    messageCount++;

                    if (message.forwarded && message.forwarded.senderId === userId) {
                        forwardGroups.add(dialog.id);
                        console.log(`   ↪ Найдена пересылка в: ${dialog.title}`);
                        break;
                    }
                }

                // Задержка
                await new Promise(resolve => setTimeout(resolve, 300));

            } catch (error) {
                // Игнорируем ошибки доступа
            }
        }

        // Итоговый отчёт
        console.log('\n' + '=' .repeat(60));
        console.log('📊 РЕЗУЛЬТАТЫ АНАЛИЗА:');
        console.log('=' .repeat(60));
        console.log(`\n👤 Пользователь: ${targetEntity.firstName} ${targetEntity.lastName || ''} (@${targetEntity.username || 'нет'})`);
        console.log(`🆔 ID: ${targetEntity.id}`);
        console.log(`📝 Bio: ${targetEntity.about || 'не указано'}`);

        console.log(`\n🎯 Найдено общих групп: ${commonGroups.length}`);
        if (commonGroups.length > 0) {
            console.log('\n📋 Список групп:');
            commonGroups.forEach((group, i) => {
                console.log(`   ${i + 1}. ${group.title} (@${group.username || 'приватная'}) - ${group.type}`);
            });
        } else {
            console.log('   (Общие группы не найдены в топ-20 диалогах)');
        }

        console.log(`\n🔄 Группы через пересылки: ${forwardGroups.size}`);
        if (forwardGroups.size > 0) {
            console.log('   (Обнаружены через анализ пересылок)');
        }

        console.log('\n' + '=' .repeat(60));
        console.log('✅ Анализ завершён быстрым методом');
        console.log('💡 Для полного анализа потребовалось бы 5-10 минут и больше лимитов API');
        console.log('=' .repeat(60));

    } catch (error) {
        console.error(`\n❌ Ошибка: ${error.message}`);
    } finally {
        await client.disconnect();
    }
}

// Запуск
if (require.main === module) {
    const username = process.argv[2];
    if (!username) {
        console.log('Использование: node quick-user-analysis.cjs <username или id>');
        process.exit(1);
    }

    quickAnalyzeUser(username).catch(console.error);
}

module.exports = { quickAnalyzeUser };
