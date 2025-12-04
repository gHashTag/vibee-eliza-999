/**
 * 🎯 СЕРВИС ПРОАКТИВНОГО ОБУЧЕНИЯ KOLS
 * Генерирует обучающий контент из книги "Agentic Vibecoding"
 * и отправляет его раз в час через LLM
 */

import { IAgentRuntime } from '@elizaos/core';
import { KolsLogger } from '../utils/logger';
import { VibeCodingKnowledgeProvider, KnowledgeChunk } from '../providers/VibeCodingKnowledgeProvider';

export interface ProactiveConfig {
  intervalMinMinutes: number;
  intervalMaxMinutes: number;
  maxTokens: number;
  temperature: number;
}

export type MessageType = 'concept' | 'tip' | 'example' | 'question' | 'exercise';

export class KolsProactiveService {
  private timerId: NodeJS.Timeout | null = null;
  private isActive: boolean = false;
  private targetChats: Set<string> = new Set();
  private lastMessageTime: Map<string, number> = new Map();
  private usedChunkIds: Set<string> = new Set();
  private runtime: IAgentRuntime | null = null;
  private knowledgeProvider: VibeCodingKnowledgeProvider;
  private sendMessageFn: ((chatId: string, text: string) => Promise<void>) | null = null;
  
  private config: ProactiveConfig = {
    intervalMinMinutes: 60,
    intervalMaxMinutes: 90,
    maxTokens: 300,
    temperature: 0.8
  };

  private systemPrompts: Record<MessageType, string> = {
    concept: `Ты VIBEE Agent - наставник по VibeCoding и современной разработке с AI.

КРИТИЧЕСКИЕ ПРАВИЛА:
1. НИКОГДА не начинай с приветствий (Привет, Здравствуй, Добрый день)
2. НИКОГДА не обращайся по имени
3. НИКОГДА не используй эмодзи и смайлики
4. СРАЗУ переходи к сути
5. Будь РАЗНООБРАЗНЫМ в формулировках

Объясни студентам концепцию из книги "Agentic Vibecoding".
Используй простой язык, аналогии из жизни.
Ответ должен быть 2-4 предложения, без эмодзи, деловым языком.`,

    tip: `Ты VIBEE Agent - эксперт по современной разработке.

КРИТИЧЕСКИЕ ПРАВИЛА:
1. НИКОГДА не начинай с приветствий
2. НИКОГДА не обращайся по имени  
3. НИКОГДА не используй эмодзи
4. СРАЗУ к полезному совету

Поделись практическим советом из Библии VibeCoder.
Совет должен быть конкретным и применимым сразу.
2-3 предложения, деловой стиль.`,

    example: `Ты VIBEE Agent - практик VibeCoding.

КРИТИЧЕСКИЕ ПРАВИЛА:
1. НИКОГДА не начинай с приветствий
2. НИКОГДА не используй эмодзи
3. СРАЗУ к примеру

Разбери практический пример из книги.
Покажи как применить на практике.
3-4 предложения без эмодзи.`,

    question: `Ты VIBEE Agent - наставник, проверяющий понимание студентов.

КРИТИЧЕСКИЕ ПРАВИЛА:
1. НИКОГДА не начинай с приветствий
2. НИКОГДА не используй эмодзи
3. СРАЗУ задай вопрос

Задай провокационный вопрос для проверки понимания.
Вопрос должен заставить задуматься о VibeCoding или AI-агентах.
1-2 предложения.`,

    exercise: `Ты VIBEE Agent - практический тренер.

КРИТИЧЕСКИЕ ПРАВИЛА:
1. НИКОГДА не начинай с приветствий
2. НИКОГДА не используй эмодзи
3. СРАЗУ к заданию

Предложи практическое задание на 15-30 минут.
Задание должно быть выполнимым новичком.
2-3 предложения.`
  };

  constructor() {
    this.knowledgeProvider = new VibeCodingKnowledgeProvider();
    KolsLogger.timer('🔧 Создан сервис проактивного обучения KOLS');
  }

  async initialize(
    runtime: IAgentRuntime,
    sendMessageFn: (chatId: string, text: string) => Promise<void>,
    targetChats?: string[]
  ): Promise<void> {
    this.runtime = runtime;
    this.sendMessageFn = sendMessageFn;

    await this.knowledgeProvider.loadKnowledgeBase();
    
    const stats = this.knowledgeProvider.getStats();
    KolsLogger.success(`📚 Загружена книга: ${stats.sections} секций, ${stats.chunks} чанков`);

    if (targetChats) {
      targetChats.forEach(chatId => this.targetChats.add(chatId));
    }
  }

  startActivity(targetChats?: string[]): void {
    if (this.isActive) {
      KolsLogger.warning('⚠️ Проактивный сервис уже активен!');
      return;
    }

    this.isActive = true;

    if (targetChats && targetChats.length > 0) {
      targetChats.forEach(chatId => this.targetChats.add(chatId));
    }

    KolsLogger.activity('🚀 Проактивное обучение запущено!');
    KolsLogger.timer(`📊 Целевые чаты: ${this.targetChats.size}`);
    KolsLogger.timer(`⏰ Интервал: ${this.config.intervalMinMinutes}-${this.config.intervalMaxMinutes} минут`);

    this.scheduleNextMessage();
  }

  stopActivity(): void {
    if (!this.isActive) return;

    this.isActive = false;

    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }

    KolsLogger.activity('🛑 Проактивное обучение остановлено');
  }

  addTargetChat(chatId: string): void {
    this.targetChats.add(chatId);
    KolsLogger.chat(`➕ Добавлен целевой чат: ${chatId}`);
  }

  removeTargetChat(chatId: string): void {
    this.targetChats.delete(chatId);
    KolsLogger.chat(`➖ Удален целевой чат: ${chatId}`);
  }

  private scheduleNextMessage(): void {
    if (!this.isActive) return;

    const delay = this.calculateRandomDelay();

    KolsLogger.timer(`⏰ Следующее обучающее сообщение через ${Math.round(delay / 60000)} минут`);

    this.timerId = setTimeout(async () => {
      if (!this.isActive) return;

      await this.sendProactiveTeachingMessage();
      this.scheduleNextMessage();
    }, delay);
  }

  private calculateRandomDelay(): number {
    const minDelay = this.config.intervalMinMinutes * 60 * 1000;
    const maxDelay = this.config.intervalMaxMinutes * 60 * 1000;
    
    const baseDelay = minDelay + Math.random() * (maxDelay - minDelay);
    const randomFactor = 0.8 + Math.random() * 0.4;
    
    return Math.round(baseDelay * randomFactor);
  }

  private selectRandomType(): MessageType {
    const types: MessageType[] = ['concept', 'tip', 'example', 'question', 'exercise'];
    const weights = [0.25, 0.25, 0.20, 0.15, 0.15];
    
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < types.length; i++) {
      cumulative += weights[i];
      if (random < cumulative) return types[i];
    }
    
    return 'tip';
  }

  private getUnusedChunk(type?: KnowledgeChunk['type']): KnowledgeChunk | null {
    if (this.usedChunkIds.size > 100) {
      this.usedChunkIds.clear();
    }

    for (let i = 0; i < 10; i++) {
      const chunk = this.knowledgeProvider.getRandomChunk(type);
      if (chunk && !this.usedChunkIds.has(chunk.id)) {
        this.usedChunkIds.add(chunk.id);
        return chunk;
      }
    }

    return this.knowledgeProvider.getRandomChunk();
  }

  private async generateTeachingMessage(chunk: KnowledgeChunk): Promise<string> {
    if (!this.runtime) {
      throw new Error('Runtime не инициализирован');
    }

    const messageType = chunk.type as MessageType;
    const systemPrompt = this.systemPrompts[messageType] || this.systemPrompts.tip;

    const userPrompt = `Контент из главы "${chunk.chapter}":
${chunk.content}

На основе этого контента создай УНИКАЛЬНОЕ обучающее сообщение для студентов.
Не копируй текст дословно - переработай и объясни своими словами.`;

    try {
      KolsLogger.bot(`🤖 Генерирую сообщение типа "${messageType}" из главы "${chunk.chapter}"...`);

      const response = await this.runtime.useModel('TEXT_SMALL', {
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        maxTokens: this.config.maxTokens,
        temperature: this.config.temperature,
      });

      const generatedText = response?.trim();

      if (!generatedText || generatedText.length < 20) {
        throw new Error('LLM вернул пустой или слишком короткий ответ');
      }

      KolsLogger.success(`✅ LLM сгенерировал сообщение (${generatedText.length} символов)`);
      return generatedText;

    } catch (error) {
      KolsLogger.error('❌ Ошибка генерации LLM:', error);
      return this.createFallbackMessage(chunk);
    }
  }

  private createFallbackMessage(chunk: KnowledgeChunk): string {
    const prefixes: Record<KnowledgeChunk['type'], string> = {
      concept: 'Ключевая концепция VibeCoding:',
      tip: 'Практический совет:',
      example: 'Пример из практики:',
      question: 'Вопрос для размышления:',
      exercise: 'Практическое задание:'
    };

    const prefix = prefixes[chunk.type] || 'Из книги Agentic Vibecoding:';
    const content = chunk.content.substring(0, 250);
    
    return `${prefix} ${content}${chunk.content.length > 250 ? '...' : ''}`;
  }

  private async sendProactiveTeachingMessage(): Promise<void> {
    if (this.targetChats.size === 0) {
      KolsLogger.warning('⚠️ Нет целевых чатов для обучения!');
      return;
    }

    if (!this.sendMessageFn) {
      KolsLogger.error('❌ Функция отправки сообщений не установлена!');
      return;
    }

    try {
      const messageType = this.selectRandomType();
      const chunk = this.getUnusedChunk(messageType);

      if (!chunk) {
        KolsLogger.warning('⚠️ Не удалось получить контент из knowledge base');
        return;
      }

      KolsLogger.activity(`🎬 KOLS обучает студентов!`);
      KolsLogger.bot(`📖 Глава: "${chunk.chapter}", тип: ${chunk.type}`);

      const teachingMessage = await this.generateTeachingMessage(chunk);

      for (const chatId of this.targetChats) {
        try {
          await this.sendMessageFn(chatId, teachingMessage);
          KolsLogger.success(`✅ Обучающее сообщение отправлено в чат ${chatId}`);
        } catch (error) {
          KolsLogger.error(`❌ Ошибка отправки в чат ${chatId}:`, error);
        }
      }

      this.lastMessageTime.set(chunk.type, Date.now());

    } catch (error) {
      KolsLogger.error('❌ Ошибка отправки проактивного сообщения:', error);
    }
  }

  async sendImmediateTeachingMessage(type?: MessageType): Promise<string | null> {
    const chunk = this.getUnusedChunk(type);
    if (!chunk) return null;

    const message = await this.generateTeachingMessage(chunk);
    
    if (this.sendMessageFn && this.targetChats.size > 0) {
      for (const chatId of this.targetChats) {
        await this.sendMessageFn(chatId, message);
      }
    }

    return message;
  }

  getStatus(): {
    isActive: boolean;
    targetChats: number;
    usedChunks: number;
    knowledgeStats: { sections: number; chunks: number; byType: Record<string, number> };
    config: ProactiveConfig;
  } {
    return {
      isActive: this.isActive,
      targetChats: this.targetChats.size,
      usedChunks: this.usedChunkIds.size,
      knowledgeStats: this.knowledgeProvider.getStats(),
      config: this.config
    };
  }

  updateConfig(newConfig: Partial<ProactiveConfig>): void {
    this.config = { ...this.config, ...newConfig };
    KolsLogger.timer(`⚙️ Конфигурация обновлена: ${JSON.stringify(this.config)}`);
  }

  // Для тестирования
  getKnowledgeProvider(): VibeCodingKnowledgeProvider {
    return this.knowledgeProvider;
  }
}

export default KolsProactiveService;
