/**
 * KOLS Logger - Профессиональное логирование для Node.js
 *
 * Использует ANSI escape коды для цветов в терминале.
 * Каждый уровень имеет свой цвет и эмодзи.
 *
 * ВАЖНО: CSS стили (%c) НЕ работают в Node.js терминале!
 * Используем ANSI escape коды для цветного вывода.
 */

// ANSI цвета для терминала
const ANSI = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',

  // Цвета текста
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',

  // Яркие версии
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',

  // Фоны
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
} as const;

// Конфигурация уровней логирования
const LEVELS = {
  ERROR:   { emoji: '\u274C', color: ANSI.brightRed,     label: 'ERROR' },
  WARN:    { emoji: '\u26A0\uFE0F',  color: ANSI.brightYellow,  label: 'WARN' },
  INFO:    { emoji: '\u2139\uFE0F',  color: ANSI.brightBlue,    label: 'INFO' },
  SUCCESS: { emoji: '\u2705', color: ANSI.brightGreen,   label: 'SUCCESS' },
  DEBUG:   { emoji: '\uD83D\uDD0D', color: ANSI.magenta,       label: 'DEBUG' },

  // Специальные для Telegram
  MSG_IN:  { emoji: '\uD83D\uDCE8', color: ANSI.cyan,          label: 'INCOMING' },
  MSG_OUT: { emoji: '\uD83D\uDCE4', color: ANSI.green,         label: 'OUTGOING' },
  BOT:     { emoji: '\uD83E\uDD16', color: ANSI.brightMagenta, label: 'BOT' },
  CHAT:    { emoji: '\uD83D\uDCAC', color: ANSI.brightCyan,    label: 'CHAT' },
  TIMER:   { emoji: '\u23F0', color: ANSI.yellow,        label: 'TIMER' },
  TRIGGER: { emoji: '\uD83C\uDFAF', color: ANSI.brightYellow,  label: 'TRIGGER' },

  // События GramJS
  EVENT_EDIT:     { emoji: '\u270F\uFE0F',  color: ANSI.yellow,       label: 'EDITED' },
  EVENT_DELETE:   { emoji: '\uD83D\uDDD1\uFE0F',  color: ANSI.red,          label: 'DELETED' },
  EVENT_CALLBACK: { emoji: '\uD83D\uDD18', color: ANSI.brightBlue,   label: 'CALLBACK' },
  EVENT_ALBUM:    { emoji: '\uD83D\uDCF8', color: ANSI.brightCyan,   label: 'ALBUM' },
  EVENT_RAW:      { emoji: '\u26A1', color: ANSI.gray,         label: 'RAW' },
} as const;

type LevelKey = keyof typeof LEVELS;

export class KolsLogger {
  private static isDebugEnabled = process.env.LOG_LEVEL === 'debug';

  private static getTimestamp(): string {
    return new Date().toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  private static format(level: LevelKey, message: string): string {
    const { emoji, color, label } = LEVELS[level];
    const time = this.getTimestamp();
    return `${color}${emoji} [${time}] [${label}]${ANSI.reset} ${message}`;
  }

  // === Базовые методы ===
  static error(message: string, error?: unknown): void {
    console.error(this.format('ERROR', message));
    if (error) {
      const errorStr = error instanceof Error ? error.stack || error.message : String(error);
      console.error(`${ANSI.dim}${errorStr}${ANSI.reset}`);
    }
  }

  static warn(message: string): void {
    console.warn(this.format('WARN', message));
  }

  static warning(message: string): void {
    this.warn(message);
  }

  static info(message: string): void {
    console.log(this.format('INFO', message));
  }

  static success(message: string): void {
    console.log(this.format('SUCCESS', message));
  }

  static debug(message: string): void {
    if (this.isDebugEnabled) {
      console.log(this.format('DEBUG', message));
    }
  }

  // === Telegram-специфичные методы ===
  static bot(message: string): void {
    console.log(this.format('BOT', message));
  }

  static chat(message: string): void {
    console.log(this.format('CHAT', message));
  }

  static timer(message: string): void {
    console.log(this.format('TIMER', message));
  }

  static trigger(triggerWord: string, text?: string): void {
    if (text) {
      const preview = text.length > 50 ? text.substring(0, 50) + '...' : text;
      console.log(this.format('TRIGGER', `"${triggerWord}" \u0432: "${preview}"`));
    } else {
      console.log(this.format('TRIGGER', triggerWord));
    }
  }

  // === Детальное логирование сообщений ===

  /**
   * Логирует входящее сообщение с полной информацией
   */
  static incomingMessage(params: {
    chatId: string;
    chatTitle: string;
    chatType: '\u041B\u0421' | '\u0433\u0440\u0443\u043F\u043F\u0430' | '\u043A\u0430\u043D\u0430\u043B';
    userId: string;
    userName: string;
    text: string;
  }): void {
    const { chatId, chatTitle, chatType, userId, userName, text } = params;
    const preview = text.length > 100 ? text.substring(0, 100) + '...' : text;

    console.log('');
    console.log(`${ANSI.brightCyan}${'\u2500'.repeat(60)}${ANSI.reset}`);
    console.log(this.format('MSG_IN', `[${chatType}] ${chatTitle}`));
    console.log(`   ${ANSI.gray}\u0427\u0430\u0442 ID:${ANSI.reset}      ${ANSI.cyan}${chatId}${ANSI.reset}`);
    console.log(`   ${ANSI.gray}\u041E\u0442:${ANSI.reset}          ${ANSI.yellow}${userName}${ANSI.reset} ${ANSI.dim}(ID: ${userId})${ANSI.reset}`);
    console.log(`   ${ANSI.gray}\u0422\u0435\u043A\u0441\u0442:${ANSI.reset}       ${preview}`);
    console.log(`${ANSI.brightCyan}${'\u2500'.repeat(60)}${ANSI.reset}`);
  }

  /**
   * Логирует исходящее сообщение
   */
  static outgoingMessage(params: {
    chatId: string;
    chatTitle: string;
    text: string;
    replyToUser?: string;
  }): void {
    const { chatId, chatTitle, text, replyToUser } = params;
    const preview = text.length > 80 ? text.substring(0, 80) + '...' : text;

    const replyInfo = replyToUser ? ` \u2192 ${replyToUser}` : '';
    console.log(this.format('MSG_OUT', `${chatTitle}${replyInfo}`));
    console.log(`   ${ANSI.gray}\u0427\u0430\u0442 ID:${ANSI.reset}      ${ANSI.cyan}${chatId}${ANSI.reset}`);
    console.log(`   ${ANSI.gray}\u041E\u0442\u0432\u0435\u0442:${ANSI.reset}       ${ANSI.green}${preview}${ANSI.reset}`);
  }

  /**
   * Логирует пропущенное сообщение (не целевой чат)
   */
  static skippedMessage(params: {
    chatId: string;
    chatTitle: string;
    chatType: '\u041B\u0421' | '\u0433\u0440\u0443\u043F\u043F\u0430';
    reason: string;
  }): void {
    const { chatId, chatTitle, chatType, reason } = params;
    console.log(
      `${ANSI.dim}\u23ED\uFE0F  [${this.getTimestamp()}] \u041F\u0440\u043E\u043F\u0443\u0449\u0435\u043D\u043E [${chatType}]: ` +
      `${chatTitle} (${chatId}) - ${reason}${ANSI.reset}`
    );
  }

  /**
   * Логирует генерацию LLM ответа
   */
  static llmGeneration(params: {
    forUser: string;
    userId: string;
    prompt?: string;
    responseLength?: number;
  }): void {
    const { forUser, userId, prompt, responseLength } = params;

    if (responseLength !== undefined) {
      console.log(this.format('SUCCESS',
        `LLM \u043E\u0442\u0432\u0435\u0442 \u0434\u043B\u044F ${forUser} (${userId}): ${responseLength} \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432`
      ));
    } else if (prompt) {
      const promptPreview = prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt;
      console.log(this.format('BOT',
        `\u0413\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u044F LLM \u0434\u043B\u044F ${forUser} (${userId}): "${promptPreview}"`
      ));
    }
  }

  // === События GramJS ===

  /**
   * Логирует отредактированное сообщение
   */
  static eventEdited(params: {
    messageId: number;
    chatId: string;
    newText: string;
    editDate?: number;
  }): void {
    const { messageId, chatId, newText } = params;
    const preview = newText.length > 50 ? newText.substring(0, 50) + '...' : newText;
    console.log(this.format('EVENT_EDIT',
      `\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 ${messageId} \u0432 \u0447\u0430\u0442\u0435 ${chatId} \u043E\u0442\u0440\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u043E: "${preview}"`
    ));
  }

  /**
   * Логирует удаленное сообщение
   */
  static eventDeleted(params: {
    messageId: number;
    chatId: string;
  }): void {
    console.log(this.format('EVENT_DELETE',
      `\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 ${params.messageId} \u0443\u0434\u0430\u043B\u0435\u043D\u043E \u0432 \u0447\u0430\u0442\u0435 ${params.chatId}`
    ));
  }

  /**
   * Логирует клик по inline кнопке
   */
  static eventCallback(params: {
    userId: string;
    messageId?: number;
    data: string;
  }): void {
    console.log(this.format('EVENT_CALLBACK',
      `\u041A\u043B\u0438\u043A \u043F\u043E \u043A\u043D\u043E\u043F\u043A\u0435 \u043E\u0442 ${params.userId}: "${params.data}"`
    ));
  }

  /**
   * Логирует альбом (группу медиа)
   */
  static eventAlbum(params: {
    messagesCount: number;
    chatId: string;
    messageIds: number[];
  }): void {
    console.log(this.format('EVENT_ALBUM',
      `\u0410\u043B\u044C\u0431\u043E\u043C \u0438\u0437 ${params.messagesCount} \u043C\u0435\u0434\u0438\u0430 \u0432 \u0447\u0430\u0442\u0435 ${params.chatId}`
    ));
  }

  /**
   * Логирует raw событие (только в debug режиме)
   */
  static eventRaw(params: {
    type: string;
    data: string;
  }): void {
    if (this.isDebugEnabled) {
      console.log(this.format('EVENT_RAW', `${params.type}: ${params.data}`));
    }
  }

  // === Утилиты ===

  /**
   * Разделитель секций
   */
  static separator(title?: string): void {
    if (title) {
      const padding = Math.max(0, 50 - title.length);
      console.log(`\n${ANSI.bright}\u2550\u2550\u2550 ${title} ${'\u2550'.repeat(padding)}${ANSI.reset}\n`);
    } else {
      console.log(`${ANSI.dim}${'\u2500'.repeat(60)}${ANSI.reset}`);
    }
  }

  /**
   * Статус бота (красивый блок)
   */
  static botStatus(params: {
    connected: boolean;
    targetChats: number;
    messagesProcessed: number;
  }): void {
    const { connected, targetChats, messagesProcessed } = params;
    const status = connected
      ? `${ANSI.green}\u25CF ONLINE${ANSI.reset}`
      : `${ANSI.red}\u25CF OFFLINE${ANSI.reset}`;

    console.log('');
    console.log(`${ANSI.bright}\u2554${'='.repeat(36)}\u2557${ANSI.reset}`);
    console.log(`${ANSI.bright}\u2551${ANSI.reset}  \uD83E\uDD16 KOLS Agent Status              ${ANSI.bright}\u2551${ANSI.reset}`);
    console.log(`${ANSI.bright}\u2560${'='.repeat(36)}\u2563${ANSI.reset}`);
    console.log(`${ANSI.bright}\u2551${ANSI.reset}  \u0421\u0442\u0430\u0442\u0443\u0441:     ${status}               ${ANSI.bright}\u2551${ANSI.reset}`);
    console.log(`${ANSI.bright}\u2551${ANSI.reset}  \u0427\u0430\u0442\u044B:       ${String(targetChats).padEnd(20)}   ${ANSI.bright}\u2551${ANSI.reset}`);
    console.log(`${ANSI.bright}\u2551${ANSI.reset}  \u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439:  ${String(messagesProcessed).padEnd(20)}   ${ANSI.bright}\u2551${ANSI.reset}`);
    console.log(`${ANSI.bright}\u255A${'='.repeat(36)}\u255D${ANSI.reset}`);
    console.log('');
  }

  // === Методы для обратной совместимости ===

  static message(msg: string): void {
    console.log(this.format('MSG_IN', msg));
  }

  static sendMessage(chatId: string, message: string): void {
    const preview = message.length > 50 ? message.substring(0, 50) + '...' : message;
    console.log(this.format('MSG_OUT', `\u041E\u0442\u043F\u0440\u0430\u0432\u043A\u0430 \u0432 ${chatId}: ${preview}`));
  }

  static receiveMessage(chatId: string, userId: string, text: string): void {
    const preview = text.length > 50 ? text.substring(0, 50) + '...' : text;
    console.log(this.format('MSG_IN', `\u041F\u043E\u043B\u0443\u0447\u0435\u043D\u043E \u0438\u0437 ${chatId} \u043E\u0442 ${userId}: ${preview}`));
  }

  static processing(message: string): void {
    console.log(this.format('INFO', `\u2699\uFE0F ${message}`));
  }

  static activity(message: string): void {
    console.log(this.format('SUCCESS', `\uD83C\uDFAC ${message}`));
  }

  static db(message: string): void {
    console.log(`${ANSI.magenta}\uD83D\uDDC4\uFE0F  [${this.getTimestamp()}] [DB]${ANSI.reset} ${message}`);
  }
}

// Экспорт для обратной совместимости
export enum LogLevel {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
  BOT = 'BOT',
  MESSAGE = 'MESSAGE',
  CHAT = 'CHAT',
  TRIGGER = 'TRIGGER',
  TIMER = 'TIMER',
  DB = 'DB'
}
