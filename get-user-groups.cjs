/**
 * 🎯 Получение групп пользователя - практические методы
 * Работает на Node.js через GramJS
 */

// Метод 1: Поиск в общих группах (самый надёжный)
async function findCommonGroups(client, targetUserId) {
    const commonGroups = [];

    console.log('🔍 Ищу общие группы...');

    for await (const dialog of client.iterDialogs()) {
        const entity = dialog.entity;

        // Проверяем только группы и каналы
        if (entity.type !== 'chat' && entity.type !== 'channel') continue;

        try {
            let found = false;

            // Для обычных групп
            if (entity.type === 'chat') {
                for await (const participant of client.iterParticipants(entity)) {
                    if (participant.sponsor.id === targetUserId) {
                        found = true;
                        break;
                    }
                }
            }

            // Для супергрупп и каналов
            if (entity.type === 'channel') {
                for await (const participant of client.iterParticipants(entity)) {
                    if (participant.sponsor.id === targetUserId) {
                        found = true;
                        break;
                    }
                }
            }

            if (found) {
                commonGroups.push({
                    id: dialog.id,
                    title: dialog.title,
                    type: entity.type,
                    username: entity.username
                });
                console.log(`   ✓ Найден в группе: ${dialog.title}`);
            }

        } catch (error) {
            // Игнорируем ошибки доступа
            if (!error.message.includes('CHAT_WRITE_FORBIDDEN')) {
                console.log(`   ✗ Ошибка в ${dialog.title}: ${error.message}`);
            }
        }
    }

    return commonGroups;
}

// Метод 2: Анализ пересылок
async function analyzeForwards(client, targetUserId) {
    const foundGroups = new Set();
    const forwardMessages = [];

    console.log('🔍 Анализирую пересылки...');

    for await (const dialog of client.iterDialogs()) {
        const entity = dialog.entity;

        try {
            for await (const message of client.iterMessages(entity, { limit: 100 })) {
                // Проверяем пересланные сообщения
                if (message.forwarded && message.forwarded.senderId === targetUserId) {
                    foundGroups.add(dialog.id);
                    forwardMessages.push({
                        groupId: dialog.id,
                        groupTitle: dialog.title,
                        messageId: message.id,
                        date: message.date
                    });
                    console.log(`   ✓ Пересылает из: ${dialog.title}`);
                }
            }
        } catch (error) {
            // Игнорируем ошибки доступа
        }
    }

    return {
        groups: Array.from(foundGroups),
        forwards: forwardMessages
    };
}

// Метод 3: Проверка взаимных контактов
async function getMutualContacts(client, targetUserId) {
    console.log('🔍 Проверяю взаимные контакты...');

    try {
        // Получаем контакты
        const contacts = [];
        for await (const contact of client.getContacts()) {
            contacts.push(contact);
        }

        // Ищем целевого пользователя
        const targetContact = contacts.find(c => c.id === targetUserId);
        if (!targetContact) {
            console.log('   ❌ Пользователь не в контактах');
            return [];
        }

        // Получаем общие чаты (если метод доступен)
        try {
            // GramJS не имеет прямого get_common_chats, поэтому используем альтернативу
            const mutualGroups = await findCommonGroups(client, targetUserId);
            console.log(`   ✓ Найдено общих групп: ${mutualGroups.length}`);
            return mutualGroups;
        } catch (error) {
            console.log(`   ⚠️ Не удалось получить общие чаты: ${error.message}`);
            return [];
        }

    } catch (error) {
        console.log(`   ❌ Ошибка получения контактов: ${error.message}`);
        return [];
    }
}

// Метод 4: Анализ активности в каналах
async function analyzeChannelActivity(client, targetUserId) {
    const activeChannels = [];

    console.log('🔍 Анализирую активность в каналах...');

    for await (const dialog of client.iterDialogs()) {
        const entity = dialog.entity;

        // Только каналы
        if (entity.type !== 'channel') continue;

        try {
            let hasMessages = false;
            let messageCount = 0;

            for await (const message of client.iterMessages(entity, { limit: 50 })) {
                if (message.sender && message.sender.id === targetUserId) {
                    hasMessages = true;
                    messageCount++;
                }
            }

            if (hasMessages) {
                activeChannels.push({
                    id: dialog.id,
                    title: dialog.title,
                    username: entity.username,
                    messagesCount: messageCount
                });
                console.log(`   ✓ Активен в канале: ${dialog.title} (${messageCount} сообщений)`);
            }

        } catch (error) {
            // Игнорируем ошибки доступа
        }
    }

    return activeChannels;
}

// Основная функция
async function getUserGroups(client, usernameOrId) {
    console.log(`\n🎯 Ищу группы для пользователя: ${usernameOrId}`);
    console.log('='.repeat(60));

    // Получаем сущность пользователя
    let targetEntity;
    try {
        if (typeof usernameOrId === 'string' && usernameOrId.match(/^\d+$/)) {
            targetEntity = await client.getEntity(parseInt(usernameOrId));
        } else {
            targetEntity = await client.getEntity(usernameOrId);
        }
    } catch (error) {
        console.log(`❌ Не удалось найти пользователя: ${error.message}`);
        return;
    }

    const targetUserId = targetEntity.id;

    // Собираем результаты разными методами
    const results = {
        basic: {
            id: targetEntity.id,
            firstName: targetEntity.firstName,
            lastName: targetEntity.lastName,
            username: targetEntity.username
        },
        commonGroups: await findCommonGroups(client, targetUserId),
        forwardAnalysis: await analyzeForwards(client, targetUserId),
        channelActivity: await analyzeChannelActivity(client, targetUserId),
        mutualContacts: await getMutualContacts(client, targetUserId)
    };

    // Убираем дубликаты
    const allGroups = new Map();

    results.commonGroups.forEach(group => {
        allGroups.set(group.id, { ...group, method: 'common' });
    });

    results.forwardAnalysis.groups.forEach(groupId => {
        if (allGroups.has(groupId)) {
            allGroups.get(groupId).method += '+forward';
        }
    });

    results.channelActivity.forEach(channel => {
        allGroups.set(channel.id, {
            id: channel.id,
            title: channel.title,
            username: channel.username,
            type: 'channel',
            method: 'activity'
        });
    });

    results.mutualContacts.forEach(group => {
        if (allGroups.has(group.id)) {
            allGroups.get(group.id).method += '+mutual';
        } else {
            allGroups.set(group.id, { ...group, method: 'mutual' });
        }
    });

    // Итоговый отчёт
    const finalResults = {
        user: results.basic,
        totalGroupsFound: allGroups.size,
        groups: Array.from(allGroups.values()),
        methods: {
            commonGroups: results.commonGroups.length,
            forwardMessages: results.forwardAnalysis.forwards.length,
            activeChannels: results.channelActivity.length,
            mutualContacts: results.mutualContacts.length
        },
        coverage: {
            commonGroups: `${results.commonGroups.length} групп`,
            forwardBased: `${results.forwardAnalysis.groups.length} групп`,
            activityBased: `${results.channelActivity.length} каналов`
        }
    };

    // Выводим результат
    console.log('\n📊 РЕЗУЛЬТАТЫ ПОИСКА:');
    console.log('='.repeat(60));
    console.log(`Пользователь: ${results.basic.firstName} ${results.basic.lastName || ''} (@${results.basic.username || 'нет'})`);
    console.log(`ID: ${results.basic.id}`);
    console.log(`\n🎯 Найдено групп: ${finalResults.totalGroupsFound}`);
    console.log(`   • Общих групп: ${results.commonGroups.length}`);
    console.log(`   • Через пересылки: ${results.forwardAnalysis.groups.length}`);
    console.log(`   • Активность в каналах: ${results.channelActivity.length}`);
    console.log(`   • Взаимные контакты: ${results.mutualContacts.length}`);

    console.log('\n📋 СПИСОК ГРУПП:');
    finalResults.groups.forEach((group, i) => {
        const methodIcon = {
            'common': '✓',
            'forward': '↪',
            'activity': '💬',
            'mutual': '👥'
        }[group.method.split('+')[0]] || '•';

        console.log(`${i + 1}. ${methodIcon} ${group.title} (@${group.username || 'приватная'})`);
        console.log(`   ID: ${group.id}, Тип: ${group.type}, Метод: ${group.method}`);
    });

    console.log('\n' + '='.repeat(60));

    return finalResults;
}

// Экспорт
module.exports = {
    getUserGroups,
    findCommonGroups,
    analyzeForwards,
    getMutualContacts,
    analyzeChannelActivity
};

// Пример использования:
if (require.main === module) {
    const { TelegramClient } = require('telegram');
    const { StringSession } = require('telegram/sessions');

    async function main() {
        const client = new TelegramClient(
            new StringSession(process.env.TELEGRAM_SESSION_STRING),
            parseInt(process.env.TELEGRAM_API_ID),
            process.env.TELEGRAM_API_HASH,
            {}
        );

        await client.connect();

        const username = process.argv[2];
        if (!username) {
            console.log('Использование: node get-user-groups.js <username или id>');
            process.exit(1);
        }

        await getUserGroups(client, username);

        await client.disconnect();
    }

    main().catch(console.error);
}
