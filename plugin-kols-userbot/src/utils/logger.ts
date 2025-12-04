/**
 * 🎨 КРАСИВЫЙ ЦВЕТНОЙ ЛОГГЕР ДЛЯ KOLS AGENT
 * С понятными цветами для студентов
 */

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

export class KolsLogger {
  private static getColor(level: LogLevel): string {
    const colors = {
      [LogLevel.INFO]: '#60A5FA',     // Синий
      [LogLevel.SUCCESS]: '#34D399',   // Зеленый
      [LogLevel.WARNING]: '#FBBF24',   // Желтый
      [LogLevel.ERROR]: '#F87171',     // Красный
      [LogLevel.DEBUG]: '#A78BFA',     // Фиолетовый
      [LogLevel.BOT]: '#F472B6',       // Розовый (KOLS)
      [LogLevel.MESSAGE]: '#38BDF8',   // Голубой
      [LogLevel.CHAT]: '#22D3EE',      // Циан
      [LogLevel.TRIGGER]: '#FB923C',   // Оранжевый
      [LogLevel.TIMER]: '#A3E635',     // Лайм
      [LogLevel.DB]: '#C084FC'         // Сиреневый
    };
    return colors[level] || '#FFFFFF';
  }

  private static getEmoji(level: LogLevel): string {
    const emojis = {
      [LogLevel.INFO]: 'ℹ️',
      [LogLevel.SUCCESS]: '✅',
      [LogLevel.WARNING]: '⚠️',
      [LogLevel.ERROR]: '❌',
      [LogLevel.DEBUG]: '🔍',
      [LogLevel.BOT]: '🤖',
      [LogLevel.MESSAGE]: '💬',
      [LogLevel.CHAT]: '👥',
      [LogLevel.TRIGGER]: '🎯',
      [LogLevel.TIMER]: '⏰',
      [LogLevel.DB]: '🗄️'
    };
    return emojis[level] || '•';
  }

  private static formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    const color = this.getColor(level);
    const emoji = this.getEmoji(level);
    const timestamp = new Date().toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const formattedMessage = `${emoji} [${timestamp}] [${level}] ${message}`;

    if (args.length > 0) {
      return `${formattedMessage}\n${JSON.stringify(args, null, 2)}`;
    }

    return formattedMessage;
  }

  static info(message: string, ...args: any[]): void {
    console.log(`%c${this.formatMessage(LogLevel.INFO, message)}`, `color: ${this.getColor(LogLevel.INFO)}`);
  }

  static success(message: string, ...args: any[]): void {
    console.log(`%c${this.formatMessage(LogLevel.SUCCESS, message)}`, `color: ${this.getColor(LogLevel.SUCCESS)}; font-weight: bold`);
  }

  static warning(message: string, ...args: any[]): void {
    console.warn(`%c${this.formatMessage(LogLevel.WARNING, message)}`, `color: ${this.getColor(LogLevel.WARNING)}; font-weight: bold`);
  }

  static error(message: string, ...args: any[]): void {
    console.error(`%c${this.formatMessage(LogLevel.ERROR, message)}`, `color: ${this.getColor(LogLevel.ERROR)}; font-weight: bold`);
  }

  static debug(message: string, ...args: any[]): void {
    console.log(`%c${this.formatMessage(LogLevel.DEBUG, message)}`, `color: ${this.getColor(LogLevel.DEBUG)}`);
  }

  // Специальные методы для KOLS
  static bot(message: string, ...args: any[]): void {
    console.log(`%c${this.formatMessage(LogLevel.BOT, `🤖 KOLS: ${message}`)}`, `color: ${this.getColor(LogLevel.BOT)}; font-weight: bold; font-size: 1.1em`);
  }

  static message(message: string, ...args: any[]): void {
    console.log(`%c${this.formatMessage(LogLevel.MESSAGE, `💬 Сообщение: ${message}`)}`, `color: ${this.getColor(LogLevel.MESSAGE)}`);
  }

  static chat(message: string, ...args: any[]): void {
    console.log(`%c${this.formatMessage(LogLevel.CHAT, `👥 Чат: ${message}`)}`, `color: ${this.getColor(LogLevel.CHAT)}; font-weight: bold`);
  }

  static trigger(message: string, ...args: any[]): void {
    console.log(`%c${this.formatMessage(LogLevel.TRIGGER, `🎯 Триггер: ${message}`)}`, `color: ${this.getColor(LogLevel.TRIGGER)}; font-weight: bold`);
  }

  static timer(message: string, ...args: any[]): void {
    console.log(`%c${this.formatMessage(LogLevel.TIMER, `⏰ Таймер: ${message}`)}`, `color: ${this.getColor(LogLevel.TIMER)}; font-weight: bold`);
  }

  static db(message: string, ...args: any[]): void {
    console.log(`%c${this.formatMessage(LogLevel.DB, `🗄️ База: ${message}`)}`, `color: ${this.getColor(LogLevel.DB)}`);
  }

  // Красивое логирование отправки сообщения
  static sendMessage(chatId: string, message: string): void {
    console.log(`%c${this.formatMessage(LogLevel.BOT, `📤 ОТПРАВКА → Чат ${chatId}: ${message}`)}`, `color: #F472B6; font-weight: bold`);
  }

  // Красивое логирование получения сообщения
  static receiveMessage(chatId: string, userId: string, text: string): void {
    console.log(`%c${this.formatMessage(LogLevel.MESSAGE, `📥 ПОЛУЧЕНО ← Чат ${chatId}, Пользователь ${userId}: ${text}`)}`, `color: #38BDF8; font-weight: bold`);
  }

  // Логирование процесса обработки
  static processing(message: string): void {
    console.log(`%c${this.formatMessage(LogLevel.INFO, `⚙️ ${message}`)}`, `color: #60A5FA`);
  }

  // Логирование активности
  static activity(message: string): void {
    console.log(`%c${this.formatMessage(LogLevel.SUCCESS, `🎬 ${message}`)}`, `color: #34D399; font-weight: bold`);
  }
}
