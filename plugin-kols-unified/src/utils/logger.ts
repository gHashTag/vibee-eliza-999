/**
 * Унифицированный логгер для плагина KOLS
 * Цветные логи для лучшего восприятия
 */

export class KolsLogger {
  private static prefix = '[KOLS-UNIFIED]';

  private static colorize(color: string, message: string): string {
    return `${color}${this.prefix} ${message}\x1b[0m`;
  }

  static info(message: string): void {
    console.log(this.colorize('\x1b[36m', `ℹ️  ${message}`));
  }

  static success(message: string): void {
    console.log(this.colorize('\x1b[32m', `✅ ${message}`));
  }

  static warning(message: string): void {
    console.log(this.colorize('\x1b[33m', `⚠️  ${message}`));
  }

  static error(message: string): void {
    console.log(this.colorize('\x1b[31m', `❌ ${message}`));
  }

  static debug(message: string): void {
    console.log(this.colorize('\x1b[90m', `🐛 ${message}`));
  }

  static bot(message: string): void {
    console.log(this.colorize('\x1b[35m', `🤖 ${message}`));
  }

  static timer(message: string): void {
    console.log(this.colorize('\x1b[36m', `⏱️  ${message}`));
  }

  static activity(message: string): void {
    console.log(this.colorize('\x1b[34m', `🎯 ${message}`));
  }

  static chat(message: string): void {
    console.log(this.colorize('\x1b[35m', `💬 ${message}`));
  }

  static sendMessage(chatId: string, message: string): void {
    const preview = message.length > 50 ? message.substring(0, 50) + '...' : message;
    console.log(this.colorize('\x1b[32m', `📤 Отправлено в ${chatId}: "${preview}"`));
  }
}
