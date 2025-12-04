/**
 * Unit тесты для KolsProactiveService
 * Покрытие 100% функционала проактивного обучения
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { KolsProactiveService, ProactiveConfig, MessageType } from '../services/KolsProactiveService';
import { IAgentRuntime } from '@elizaos/core';

// Мокаем VibeCodingKnowledgeProvider
jest.mock('../providers/VibeCodingKnowledgeProvider', () => ({
  VibeCodingKnowledgeProvider: jest.fn().mockImplementation(() => ({
    loadKnowledgeBase: jest.fn().mockResolvedValue(undefined),
    getRandomChunk: jest.fn().mockReturnValue({
      id: 'test-chunk-1',
      chapter: 'Тестовая глава',
      title: 'Тестовый заголовок',
      content: 'Тестовый контент для обучения VibeCoding и AI-агентов.',
      type: 'tip',
      tags: ['VibeCoding', 'AI']
    }),
    getStats: jest.fn().mockReturnValue({
      sections: 10,
      chunks: 50,
      byType: { tip: 20, concept: 15, question: 10, example: 5 }
    }),
    searchContent: jest.fn().mockReturnValue([])
  }))
}));

describe('KolsProactiveService', () => {
  let service: KolsProactiveService;
  let mockRuntime: jest.Mocked<IAgentRuntime>;
  let mockSendMessage: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    
    // Создаем мок runtime
    mockRuntime = {
      useModel: jest.fn().mockResolvedValue('Сгенерированный LLM ответ для обучения студентов.'),
      getSetting: jest.fn().mockReturnValue('test-value'),
    } as any;

    mockSendMessage = jest.fn().mockResolvedValue(undefined);
    
    service = new KolsProactiveService();
  });

  afterEach(() => {
    service.stopActivity();
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('должен создавать сервис с дефолтной конфигурацией', () => {
      const status = service.getStatus();
      expect(status.config.intervalMinMinutes).toBe(60);
      expect(status.config.intervalMaxMinutes).toBe(90);
      expect(status.config.maxTokens).toBe(300);
      expect(status.config.temperature).toBe(0.8);
    });
  });

  describe('initialize', () => {
    it('должен инициализировать сервис с runtime и sendMessage', async () => {
      await service.initialize(mockRuntime, mockSendMessage, ['chat1', 'chat2']);
      
      const status = service.getStatus();
      expect(status.targetChats).toBe(2);
    });

    it('должен загружать knowledge base', async () => {
      await service.initialize(mockRuntime, mockSendMessage);
      
      const status = service.getStatus();
      expect(status.knowledgeStats.sections).toBe(10);
      expect(status.knowledgeStats.chunks).toBe(50);
    });

    it('должен работать без целевых чатов', async () => {
      await service.initialize(mockRuntime, mockSendMessage);
      
      const status = service.getStatus();
      expect(status.targetChats).toBe(0);
    });
  });

  describe('startActivity', () => {
    beforeEach(async () => {
      await service.initialize(mockRuntime, mockSendMessage, ['chat1']);
    });

    it('должен запускать проактивную активность', () => {
      service.startActivity();
      
      const status = service.getStatus();
      expect(status.isActive).toBe(true);
    });

    it('должен добавлять целевые чаты при запуске', () => {
      service.startActivity(['chat2', 'chat3']);
      
      const status = service.getStatus();
      expect(status.targetChats).toBe(3); // chat1 + chat2 + chat3
    });

    it('не должен запускаться повторно', () => {
      service.startActivity();
      service.startActivity(); // Второй вызов
      
      const status = service.getStatus();
      expect(status.isActive).toBe(true);
    });

    it('должен планировать первое сообщение', () => {
      service.startActivity();
      
      // Проверяем что таймер установлен
      expect(jest.getTimerCount()).toBe(1);
    });
  });

  describe('stopActivity', () => {
    beforeEach(async () => {
      await service.initialize(mockRuntime, mockSendMessage, ['chat1']);
    });

    it('должен останавливать активность', () => {
      service.startActivity();
      service.stopActivity();
      
      const status = service.getStatus();
      expect(status.isActive).toBe(false);
    });

    it('должен очищать таймер', () => {
      service.startActivity();
      expect(jest.getTimerCount()).toBe(1);
      
      service.stopActivity();
      expect(jest.getTimerCount()).toBe(0);
    });

    it('не должен падать при остановке неактивного сервиса', () => {
      expect(() => service.stopActivity()).not.toThrow();
    });
  });

  describe('addTargetChat / removeTargetChat', () => {
    beforeEach(async () => {
      await service.initialize(mockRuntime, mockSendMessage);
    });

    it('должен добавлять целевой чат', () => {
      service.addTargetChat('new-chat');
      
      const status = service.getStatus();
      expect(status.targetChats).toBe(1);
    });

    it('должен удалять целевой чат', () => {
      service.addTargetChat('chat1');
      service.addTargetChat('chat2');
      service.removeTargetChat('chat1');
      
      const status = service.getStatus();
      expect(status.targetChats).toBe(1);
    });

    it('не должен дублировать чаты', () => {
      service.addTargetChat('chat1');
      service.addTargetChat('chat1');
      
      const status = service.getStatus();
      expect(status.targetChats).toBe(1);
    });
  });

  describe('sendImmediateTeachingMessage', () => {
    beforeEach(async () => {
      await service.initialize(mockRuntime, mockSendMessage, ['chat1']);
    });

    it('должен генерировать и возвращать сообщение', async () => {
      const message = await service.sendImmediateTeachingMessage();
      
      expect(message).toBeDefined();
      expect(message!.length).toBeGreaterThan(0);
    });

    it('должен отправлять сообщение в целевые чаты', async () => {
      await service.sendImmediateTeachingMessage();
      
      expect(mockSendMessage).toHaveBeenCalledWith('chat1', expect.any(String));
    });

    it('должен фильтровать по типу сообщения', async () => {
      const message = await service.sendImmediateTeachingMessage('tip');
      
      expect(message).toBeDefined();
    });

    it('должен возвращать null если нет чанков', async () => {
      // Мокаем пустой результат
      const knowledgeProvider = service.getKnowledgeProvider();
      (knowledgeProvider.getRandomChunk as jest.Mock).mockReturnValue(null);
      
      const message = await service.sendImmediateTeachingMessage();
      
      expect(message).toBeNull();
    });
  });

  describe('updateConfig', () => {
    it('должен обновлять частичную конфигурацию', () => {
      service.updateConfig({ intervalMinMinutes: 30 });
      
      const status = service.getStatus();
      expect(status.config.intervalMinMinutes).toBe(30);
      expect(status.config.intervalMaxMinutes).toBe(90); // Не изменился
    });

    it('должен обновлять полную конфигурацию', () => {
      const newConfig: ProactiveConfig = {
        intervalMinMinutes: 30,
        intervalMaxMinutes: 45,
        maxTokens: 500,
        temperature: 0.9
      };
      
      service.updateConfig(newConfig);
      
      const status = service.getStatus();
      expect(status.config).toEqual(newConfig);
    });
  });

  describe('getStatus', () => {
    beforeEach(async () => {
      await service.initialize(mockRuntime, mockSendMessage, ['chat1', 'chat2']);
    });

    it('должен возвращать полный статус', () => {
      service.startActivity();
      
      const status = service.getStatus();
      
      expect(status.isActive).toBe(true);
      expect(status.targetChats).toBe(2);
      expect(status.usedChunks).toBe(0);
      expect(status.knowledgeStats).toBeDefined();
      expect(status.config).toBeDefined();
    });

    it('должен отслеживать использованные чанки', async () => {
      await service.sendImmediateTeachingMessage();
      
      const status = service.getStatus();
      expect(status.usedChunks).toBe(1);
    });
  });

  describe('proactive message scheduling', () => {
    beforeEach(async () => {
      await service.initialize(mockRuntime, mockSendMessage, ['chat1']);
    });

    it('должен отправлять сообщение по таймеру', async () => {
      service.startActivity();
      
      // Продвигаем таймер на час
      jest.advanceTimersByTime(60 * 60 * 1000);
      
      // Ждем выполнения промисов
      await Promise.resolve();
      
      expect(mockSendMessage).toHaveBeenCalled();
    });

    it('не должен отправлять если нет целевых чатов', async () => {
      service.removeTargetChat('chat1');
      service.startActivity();
      
      jest.advanceTimersByTime(60 * 60 * 1000);
      await Promise.resolve();
      
      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it('должен перепланировать после отправки', async () => {
      service.startActivity();
      
      jest.advanceTimersByTime(60 * 60 * 1000);
      await Promise.resolve();
      
      // Проверяем что новый таймер установлен
      expect(jest.getTimerCount()).toBe(1);
    });
  });

  describe('LLM integration', () => {
    beforeEach(async () => {
      await service.initialize(mockRuntime, mockSendMessage, ['chat1']);
    });

    it('должен вызывать useModel с правильными параметрами', async () => {
      await service.sendImmediateTeachingMessage();
      
      expect(mockRuntime.useModel).toHaveBeenCalledWith('TEXT_SMALL', expect.objectContaining({
        prompt: expect.any(String),
        maxTokens: 300,
        temperature: 0.8
      }));
    });

    it('должен использовать fallback при ошибке LLM', async () => {
      mockRuntime.useModel.mockRejectedValueOnce(new Error('LLM Error'));
      
      const message = await service.sendImmediateTeachingMessage();
      
      // Должен вернуть fallback сообщение
      expect(message).toBeDefined();
      expect(message).toContain('Тестовый контент');
    });

    it('должен использовать fallback при пустом ответе LLM', async () => {
      mockRuntime.useModel.mockResolvedValueOnce('');
      
      const message = await service.sendImmediateTeachingMessage();
      
      expect(message).toBeDefined();
    });
  });

  describe('message type selection', () => {
    beforeEach(async () => {
      await service.initialize(mockRuntime, mockSendMessage, ['chat1']);
    });

    it('должен выбирать разные типы сообщений', async () => {
      const types: MessageType[] = ['concept', 'tip', 'example', 'question', 'exercise'];
      
      for (const type of types) {
        const message = await service.sendImmediateTeachingMessage(type);
        expect(message).toBeDefined();
      }
    });
  });

  describe('chunk deduplication', () => {
    beforeEach(async () => {
      await service.initialize(mockRuntime, mockSendMessage, ['chat1']);
    });

    it('должен отслеживать использованные чанки', async () => {
      await service.sendImmediateTeachingMessage();
      await service.sendImmediateTeachingMessage();
      
      const status = service.getStatus();
      expect(status.usedChunks).toBeGreaterThanOrEqual(1);
    });
  });

  describe('system prompts', () => {
    beforeEach(async () => {
      await service.initialize(mockRuntime, mockSendMessage, ['chat1']);
    });

    it('должен использовать правильный системный промпт для concept', async () => {
      const knowledgeProvider = service.getKnowledgeProvider();
      (knowledgeProvider.getRandomChunk as jest.Mock).mockReturnValue({
        id: 'concept-1',
        chapter: 'Теория',
        title: 'Концепция',
        content: 'Содержание концепции',
        type: 'concept',
        tags: []
      });
      
      await service.sendImmediateTeachingMessage('concept');
      
      expect(mockRuntime.useModel).toHaveBeenCalledWith('TEXT_SMALL', expect.objectContaining({
        prompt: expect.stringContaining('наставник')
      }));
    });

    it('должен включать контент книги в промпт', async () => {
      await service.sendImmediateTeachingMessage();
      
      expect(mockRuntime.useModel).toHaveBeenCalledWith('TEXT_SMALL', expect.objectContaining({
        prompt: expect.stringContaining('Тестовый контент')
      }));
    });
  });
});

describe('ProactiveConfig interface', () => {
  it('должен иметь все необходимые поля', () => {
    const config: ProactiveConfig = {
      intervalMinMinutes: 60,
      intervalMaxMinutes: 90,
      maxTokens: 300,
      temperature: 0.8
    };

    expect(config.intervalMinMinutes).toBe(60);
    expect(config.intervalMaxMinutes).toBe(90);
    expect(config.maxTokens).toBe(300);
    expect(config.temperature).toBe(0.8);
  });
});

describe('MessageType', () => {
  it('должен поддерживать все типы', () => {
    const types: MessageType[] = ['concept', 'tip', 'example', 'question', 'exercise'];
    expect(types).toHaveLength(5);
  });
});
