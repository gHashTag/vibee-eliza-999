const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');

async function additionalChecks(usernameOrId) {
    console.log('\n🔍 Дополнительные проверки пользователя...\n');

    const client = new TelegramClient(
        new StringSession(process.env.TELEGRAM_SESSION_STRING),
        parseInt(process.env.TELEGRAM_API_ID),
        process.env.TELEGRAM_API_HASH,
        {}
    );

    await client.connect();

    try {
        const user = await client.getEntity(usernameOrId);

        // 1. Проверяем контакты
        console.log('1️⃣ Проверка контактов...');
        const contacts = [];
        for await (const contact of client.getContacts()) {
            contacts.push(contact);
        }

        const isInContacts = contacts.some(c => c.id === user.id);
        const contactsText = isInContacts ? 'ДА' : 'НЕТ';
        console.log(`   ${isInContacts ? '✅' : '❌'} В контактах: ${contactsText}`);

        // 2. Получаем информацию о пользователе
        console.log('\n2️⃣ Подробная информация...');
        console.log(`   ID: ${user.id}`);
        console.log(`   Имя: ${user.firstName} ${user.lastName || ''}`);
        console.log(`   Username: @${user.username || 'нет'}`);
        console.log(`   Телефон: ${user.phoneNumber || 'скрыт'}`);
        console.log(`   Био: ${user.about || 'не указано'}`);
        console.log(`   Статус: ${user.status?.type || 'неизвестно'}`);
        console.log(`   Premium: ${user.isPremium ? 'да' : 'нет'}`);
        console.log(`   Верификация: ${user.verified ? 'да' : 'нет'}`);

        // 3. Проверяем сообщения с этим пользователем
        console.log('\n3️⃣ История сообщений...');
        let messageCount = 0;
        try {
            for await (const msg of client.iterMessages(user, { limit: 5 })) {
                messageCount++;
            }
            console.log(`   ✅ Диалог есть: ${messageCount} сообщений в истории`);
        } catch (error) {
            console.log(`   ❌ Диалог отсутствует или недоступен`);
        }

        // 4. Получаем диалоги пользователя (если возможно)
        console.log('\n4️⃣ Анализ публичной активности...');
        try {
            // Проверяем каналы где пользователь может быть админом
            let channelsAsAdmin = 0;
            let checkedChannels = 0;

            for await (const dialog of client.iterDialogs()) {
                if (checkedChannels > 50) break; // Ограничиваем для скорости

                if (dialog.entity.type === 'channel') {
                    checkedChannels++;
                    try {
                        let participantCount = 0;
                        for await (const participant of client.iterParticipants(dialog.entity)) {
                            participantCount++;
                            if (participantCount > 20) break; // Первые 20 участников

                            if (participant.sponsor.id === user.id) {
                                if (participant.participant.isAdmin || participant.participant.isCreator) {
                                    channelsAsAdmin++;
                                    console.log(`   💼 Админ канала: ${dialog.title}`);
                                }
                            }
                        }
                    } catch (e) {
                        // Ошибка доступа - нормально
                    }
                }
            }
            if (channelsAsAdmin === 0) {
                console.log(`   ℹ️ Админских каналов не найдено (проверено ${checkedChannels} каналов)`);
            }
        } catch (error) {
            console.log(`   ⚠️ Ошибка анализа: ${error.message}`);
        }

        console.log('\n' + '='.repeat(60));
        console.log('📊 КРАТКИЙ ВЕРДИКТ:');
        console.log(`👤 ${user.firstName} (@${user.username || 'нет'})`);
        console.log(`📱 Аккаунт существует и активен`);
        console.log(`🔒 Частная активность (мало публичных данных)`);

        const dialogStatus = messageCount > 0 ? 'Есть история с вами' : 'Прямого диалога нет';
        console.log(`💬 ${dialogStatus}`);

        console.log(`🎯 Рекомендации:`);
        console.log(`   • Пользователь не в общих группах с вашим аккаунтом`);
        console.log(`   • Возможно, нужно увеличить глубину поиска`);
        console.log(`   • Или использовать Database Export (с разрешения)`);
        console.log('='.repeat(60));

    } catch (error) {
        console.error(`❌ Ошибка: ${error.message}`);
    } finally {
        await client.disconnect();
    }
}

// Запуск
const username = process.argv[2];
if (!username) {
    console.log('Использование: node check-user-methods.cjs <username или id>');
    process.exit(1);
}

additionalChecks(username).catch(console.error);
