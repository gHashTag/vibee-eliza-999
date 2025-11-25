#!/usr/bin/env node

/**
 * Скрипт для симуляции входящих сообщений в группы
 * Используется для тестирования мониторинга без реального Telegram
 *
 * Использование:
 * node scripts/simulate-messages.js
 */

const fs = require('fs');
const path = require('path');

// Цвета для вывода
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Симулированные сообщения из разных групп
const simulatedMessages = [
  {
    chatId: '-1001234567890',
    chatTitle: 'Разработчики Node.js',
    fromUserId: '12345',
    fromUsername: 'alex_dev',
    fromFirstName: 'Александр',
    text: 'Помощь, не могу подключиться к базе данных',
    timestamp: new Date(),
    hasMedia: false,
  },
  {
    chatId: '-1001234567890',
    chatTitle: 'Разработчики Node.js',
    fromUserId: '67890',
    fromUsername: 'maria_pm',
    fromFirstName: 'Мария',
    text: 'Report: найден баг в production',
    timestamp: new Date(),
    hasMedia: true,
    mediaType: 'screenshot',
  },
  {
    chatId: '-1009876543210',
    chatTitle: 'Техподдержка',
    fromUserId: '11223',
    fromUsername: 'user1',
    fromFirstName: 'Иван',
    text: 'Срочно нужна помощь с авторизацией',
    timestamp: new Date(),
    hasMedia: false,
  },
  {
    chatId: '-100555666777',
    chatTitle: 'Общий чат',
    fromUserId: '44556',
    fromUsername: 'happy_user',
    fromFirstName: 'Елена',
    text: 'Отличная работа команды!',
    timestamp: new Date(),
    hasMedia: false,
  },
  {
    chatId: '-1001234567890',
    chatTitle: 'Разработчики Node.js',
    fromUserId: '77889',
    fromUsername: 'newbie_dev',
    fromFirstName: 'Дмитрий',
    text: 'Help! Как использовать GramJS?',
    timestamp: new Date(),
    hasMedia: false,
  },
];

// Функция для записи сообщения в лог
function writeToLog(message, filename = 'agent.log') {
  const logPath = path.join(__dirname, '..', filename);
  const logEntry = `[${message.timestamp.toISOString()}] 📨 [${message.chatTitle}] ${message.fromFirstName}: ${message.text}\n`;

  try {
    fs.appendFileSync(logPath, logEntry);
  } catch (error) {
    console.error('Ошибка записи в лог:', error.message);
  }
}

// Функция для отображения сообщения в консоли
function displayMessage(message, index) {
  const colors_list = [colors.cyan, colors.magenta, colors.blue, colors.green, colors.yellow];
  const color = colors_list[index % colors_list.length];

  log('\n' + '═'.repeat(80), color);
  log(`📨 Сообщение #${index + 1}`, color);
  log('═'.repeat(80), color);
  log(`📍 Группа: ${message.chatTitle}`, color);
  log(`👤 Отправитель: ${message.fromFirstName} (@${message.fromUsername})`, color);
  log(`💬 Сообщение: "${message.text}"`, color);
  log(`🕐 Время: ${message.timestamp.toLocaleTimeString()}`, color);
  log(`🆔 Chat ID: ${message.chatId}`, color);
  log(`📎 Медиа: ${message.hasMedia ? message.mediaType || 'да' : 'нет'}`, color);

  // Проверяем триггерные слова
  const triggerWords = ['help', 'помощь', 'пожаловаться', 'report', 'urgent', 'срочно'];
  const text = message.text.toLowerCase();
  const foundTriggers = triggerWords.filter(word => text.includes(word));

  if (foundTriggers.length > 0) {
    log('\n' + '⚠️'.repeat(80), colors.red);
    log(`🔔 ТРИГГЕРНЫЕ СЛОВА: ${foundTriggers.join(', ')}`, colors.red);
    log('⚠️'.repeat(80), colors.red);
  }

  log('\n');
}

// Основная функция
function main() {
  console.clear();
  log('🎭 СИМУЛЯТОР СООБЩЕНИЙ TELEGRAM', colors.cyan);
  log('═'.repeat(80), colors.cyan);
  log('Этот скрипт симулирует входящие сообщения для тестирования мониторинга', colors.yellow);
  log('═'.repeat(80), colors.cyan);
  log('');

  log('📋 Список симулируемых групп:', colors.green);
  const uniqueChats = [...new Set(simulatedMessages.map(m => m.chatTitle))];
  uniqueChats.forEach((chat, i) => log(`   ${i + 1}. ${chat}`, colors.green));
  log('');

  log('⏰ Запуск симуляции через 3 секунды...', colors.yellow);
  setTimeout(() => {
    log('\n🚀 СИМУЛЯЦИЯ НАЧАЛАСЬ!\n', colors.green);

    let index = 0;
    const interval = setInterval(() => {
      if (index >= simulatedMessages.length) {
        clearInterval(interval);
        log('\n✅ Симуляция завершена!', colors.green);
        log('═'.repeat(80), colors.cyan);
        log(`📊 Обработано сообщений: ${simulatedMessages.length}`, colors.yellow);
        log(`📝 Логи сохранены в: agent.log`, colors.yellow);
        log('═'.repeat(80), colors.cyan);
        process.exit(0);
      }

      const message = simulatedMessages[index];
      displayMessage(message, index);
      writeToLog(message);

      index++;
    }, 3000); // Сообщение каждые 3 секунды
  }, 3000);
}

// Запуск
main();
