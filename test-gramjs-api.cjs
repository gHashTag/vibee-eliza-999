/**
 * Тестирование GramJS API - полная проверка всех возможностей
 * Слушает все события и сигналы из Telegram
 */

const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const { Api } = require('telegram');
const { NewMessage, Raw } = require('telegram/events');
const path = require('path');
const fs = require('fs');

// Настройки подключения
const CONFIG = {
    // Для подключения как бот (если есть токен)
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',

    // Для подключения как пользователь
    apiId: parseInt(process.env.TELEGRAM_API_ID || '0'),
    apiHash: process.env.TELEGRAM_API_HASH || '',
    phoneNumber: process.env.TELEGRAM_PHONE || '',
    sessionString: process.env.TELEGRAM_SESSION_STRING || '',

    // Логирование
    logFile: path.join(__dirname, 'gramjs-test-log.txt'),
    logLevel: 'ALL', // ALL, EVENTS, ERRORS, OFF
};

// Счетчики событий
const counters = {
    NewMessage: 0,
    Raw: 0,
    Connection: 0,
    Disconnection: 0,
    Errors: 0,
};

// Логгер
function log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;

    if (CONFIG.logLevel === 'OFF') return;

    if (CONFIG.logLevel === 'ALL' || CONFIG.logLevel === 'EVENTS' || level === 'EVENT') {
        console.log(logEntry.trim());
        fs.appendFileSync(CONFIG.logFile, logEntry);
    }

    if (level === 'ERROR') {
        console.error(logEntry.trim());
        fs.appendFileSync(CONFIG.logFile, logEntry);
    }
}

// Инициализация лог-файла
fs.writeFileSync(CONFIG.logFile, '');
log('=== GramJS API Testing Started ===\n');
log(`Config: ${JSON.stringify(CONFIG, null, 2)}`);

// Создаем клиент
let client = null;
let session = null;
let connectionType = '';

async function initClient() {
    try {
        if (CONFIG.botToken) {
            // Подключение как бот
            log('Инициализация клиента как BOT...', 'EVENT');
            session = new StringSession(CONFIG.botToken);
            client = new TelegramClient(session, CONFIG.apiId, CONFIG.apiHash, {
                connectionRetries: 5,
            });
            connectionType = 'BOT';
        } else if (CONFIG.sessionString) {
            // Подключение с существующей сессией
            log('Инициализация клиента с сессией...', 'EVENT');
            session = new StringSession(CONFIG.sessionString);
            client = new TelegramClient(session, CONFIG.apiId, CONFIG.apiHash, {
                connectionRetries: 5,
            });
            connectionType = 'SESSION';
        } else if (CONFIG.apiId && CONFIG.apiHash && CONFIG.phoneNumber) {
            // Подключение с телефоном
            log('Инициализация клиента с телефоном...', 'EVENT');
            session = new StringSession('');
            client = new TelegramClient(session, CONFIG.apiId, CONFIG.apiHash, {
                connectionRetries: 5,
            });
            connectionType = 'PHONE';
        } else {
            log('Недостаточно данных для подключения!', 'ERROR');
            log('Нужен один из вариантов:', 'ERROR');
            log('1. TELEGRAM_BOT_TOKEN', 'ERROR');
            log('2. TELEGRAM_SESSION_STRING + API_ID + API_HASH', 'ERROR');
            log('3. TELEGRAM_API_ID + API_HASH + TELEGRAM_PHONE', 'ERROR');
            process.exit(1);
        }

        await client.connect();
        log(`Клиент подключен как ${connectionType}!`, 'EVENT');

        // Проверяем подключение
        if (connectionType !== 'BOT') {
            const me = await client.getMe();
            log(`Аккаунт: @${me.username} (ID: ${me.id})`, 'EVENT');
        }

        return true;
    } catch (error) {
        log(`Ошибка инициализации: ${error.message}`, 'ERROR');
        log(error.stack, 'ERROR');
        counters.Errors++;
        return false;
    }
}

// === ОБРАБОТЧИКИ СОБЫТИЙ ===

// 1. NewMessage - основной обработчик сообщений
async function handleNewMessage(event) {
    counters.NewMessage++;
    const message = event.message;
    const chat = await event.getChat();

    log(`\n--- NEW MESSAGE #${counters.NewMessage} ---`, 'EVENT');
    log(`Chat: ${chat.title || chat.username || chat.id}`, 'EVENT');
    log(`Chat Type: ${event.isPrivate ? 'PRIVATE' : event.isGroup ? 'GROUP' : event.isChannel ? 'CHANNEL' : 'UNKNOWN'}`, 'EVENT');
    log(`From: ${message.senderId}`, 'EVENT');
    log(`Message ID: ${message.id}`, 'EVENT');
    log(`Text: ${message.text || '(no text)'}`, 'EVENT');
    log(`Date: ${new Date(message.date * 1000).toISOString()}`, 'EVENT');
    log(`isPrivate: ${event.isPrivate}`, 'EVENT');
    log(`isGroup: ${event.isGroup}`, 'EVENT');
    log(`isChannel: ${event.isChannel}`, 'EVENT');

    // Автоответ на команды
    if (message.text === '/ping') {
        log('Отвечаю на /ping...', 'EVENT');
        await client.sendMessage(chat, { message: 'PONG!' });
    }
}

// 2. Raw Events - сырые MTProto updates
async function handleRaw(event) {
    counters.Raw++;

    // Логируем только каждый 100-й raw event, чтобы не заспамить
    if (counters.Raw % 100 === 0) {
        log(`\n--- RAW EVENT #${counters.Raw} (${event.constructor.name}) ---`, 'EVENT');
        log(`Update: ${JSON.stringify(event, null, 2)}`, 'EVENT');
    }
}

// === ОСНОВНАЯ ФУНКЦИЯ ===

async function main() {
    try {
        // Инициализация клиента
        const initialized = await initClient();
        if (!initialized) {
            log('Не удалось инициализировать клиент', 'ERROR');
            process.exit(1);
        }

        log('\n=== РЕГИСТРАЦИЯ ОБРАБОТЧИКОВ ===', 'EVENT');

        // NewMessage - слушаем ВСЕ сообщения
        client.addEventHandler(handleNewMessage, new NewMessage({
            incoming: true,
            outgoing: true,
            // Убираем фильтры, слушаем все чаты
        }));
        log('✓ NewMessage handler registered', 'EVENT');

        // Raw - слушаем все сырые события
        client.addEventHandler(handleRaw, new Raw({}));
        log('✓ Raw handler registered', 'EVENT');

        log('\n=== НАЧАЛО ПРОСЛУШИВАНИЯ ===', 'EVENT');
        log('Ожидание сообщений... (Ctrl+C для выхода)', 'EVENT');

        // Периодический отчет
        setInterval(() => {
            log('\n=== STATISTICS ===', 'EVENT');
            log(JSON.stringify(counters, null, 2), 'EVENT');
        }, 30000); // каждые 30 секунд

        // Обработка выхода
        process.on('SIGINT', async () => {
            log('\n=== ЗАВЕРШЕНИЕ ===', 'EVENT');
            log('Итого событий:', 'EVENT');
            log(JSON.stringify(counters, null, 2), 'EVENT');

            if (client) {
                await client.disconnect();
                log('Клиент отключен', 'EVENT');
            }

            process.exit(0);
        });

    } catch (error) {
        log(`Критическая ошибка: ${error.message}`, 'ERROR');
        log(error.stack, 'ERROR');
        counters.Errors++;
        process.exit(1);
    }
}

// Запуск
main();
