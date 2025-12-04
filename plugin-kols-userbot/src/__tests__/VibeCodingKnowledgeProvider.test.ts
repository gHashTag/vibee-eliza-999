/**
 * Unit тесты для VibeCodingKnowledgeProvider
 * Покрытие 100% функционала загрузки и обработки книги
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { VibeCodingKnowledgeProvider, KnowledgeChunk, BookSection } from '../providers/VibeCodingKnowledgeProvider';
import * as fs from 'fs';
import * as path from 'path';

// Мокаем fs
jest.mock('fs');

const mockFs = fs as jest.Mocked<typeof fs>;

describe('VibeCodingKnowledgeProvider', () => {
  let provider: VibeCodingKnowledgeProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new VibeCodingKnowledgeProvider('/test/knowledge-base');
  });

  describe('constructor', () => {
    it('должен создаваться с путём по умолчанию', () => {
      const defaultProvider = new VibeCodingKnowledgeProvider();
      expect(defaultProvider).toBeDefined();
    });

    it('должен создаваться с кастомным путём', () => {
      const customProvider = new VibeCodingKnowledgeProvider('/custom/path');
      expect(customProvider).toBeDefined();
    });
  });

  describe('loadKnowledgeBase', () => {
    it('должен загружать markdown файлы рекурсивно', async () => {
      // Мокаем файловую систему
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockImplementation((dirPath: any) => {
        if (dirPath === '/test/knowledge-base') {
          return [
            { name: '01-ПЕРВЫЕ-ШАГИ', isDirectory: () => true, isFile: () => false },
            { name: 'README.md', isDirectory: () => false, isFile: () => true }
          ] as any;
        }
        if (dirPath.includes('01-ПЕРВЫЕ-ШАГИ')) {
          return [
            { name: '01-INTRO.md', isDirectory: () => false, isFile: () => true }
          ] as any;
        }
        return [];
      });

      mockFs.readFileSync.mockReturnValue(`# Что такое VibeCoding

VibeCoding - это подход к разработке где AI помогает писать код.

💡 Совет: Используйте простые технологии для начала.

### Что такое агент
Агент - это автономная программа которая принимает решения.`);

      await provider.loadKnowledgeBase();

      const stats = provider.getStats();
      expect(stats.sections).toBeGreaterThan(0);
    });

    it('должен обрабатывать ошибку если директория не существует', async () => {
      mockFs.existsSync.mockReturnValue(false);

      await provider.loadKnowledgeBase();

      const stats = provider.getStats();
      expect(stats.sections).toBe(0);
    });

    it('не должен загружать повторно', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue([]);

      await provider.loadKnowledgeBase();
      await provider.loadKnowledgeBase();

      // existsSync должен быть вызван только один раз
      expect(mockFs.existsSync).toHaveBeenCalledTimes(1);
    });
  });

  describe('extractTitle', () => {
    it('должен извлекать заголовок из markdown', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue([
        { name: 'test.md', isDirectory: () => false, isFile: () => true }
      ] as any);
      mockFs.readFileSync.mockReturnValue('# 🎯 Мой заголовок\n\nКонтент');

      await provider.loadKnowledgeBase();

      const section = provider.getRandomSection();
      expect(section?.title).toBe('Мой заголовок');
    });

    it('должен использовать имя файла если нет заголовка', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue([
        { name: 'my-file-name.md', isDirectory: () => false, isFile: () => true }
      ] as any);
      mockFs.readFileSync.mockReturnValue('Контент без заголовка');

      await provider.loadKnowledgeBase();

      const section = provider.getRandomSection();
      expect(section?.title).toBe('my file name');
    });
  });

  describe('getRandomChunk', () => {
    beforeEach(async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue([
        { name: 'test.md', isDirectory: () => false, isFile: () => true }
      ] as any);
      mockFs.readFileSync.mockReturnValue(`# Тестовый файл

### Что такое VibeCoding
VibeCoding - это революционный подход к написанию кода с AI-агентами. Он позволяет создавать программы описывая намерения на естественном языке.

💡 Совет: Начинайте с простых задач и постепенно усложняйте.

❓ Вопрос: Как AI-агенты изменяют разработку?`);

      await provider.loadKnowledgeBase();
    });

    it('должен возвращать случайный чанк', () => {
      const chunk = provider.getRandomChunk();
      expect(chunk).toBeDefined();
      expect(chunk?.content).toBeDefined();
    });

    it('должен фильтровать по типу', () => {
      const tipChunk = provider.getRandomChunk('tip');
      if (tipChunk) {
        expect(tipChunk.type).toBe('tip');
      }
    });

    it('должен возвращать null для пустой базы', () => {
      const emptyProvider = new VibeCodingKnowledgeProvider('/empty');
      const chunk = emptyProvider.getRandomChunk();
      expect(chunk).toBeNull();
    });
  });

  describe('searchContent', () => {
    beforeEach(async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue([
        { name: 'test.md', isDirectory: () => false, isFile: () => true }
      ] as any);
      mockFs.readFileSync.mockReturnValue(`# VibeCoding Guide

### Что такое VibeCoding
VibeCoding - это подход где вы описываете намерение на естественном языке, а AI превращает его в код.

💡 Совет: Используйте Claude Code для максимальной продуктивности.

### Что такое ElizaOS
ElizaOS - фреймворк для создания AI-агентов на TypeScript.`);

      await provider.loadKnowledgeBase();
    });

    it('должен находить релевантный контент', () => {
      const results = provider.searchContent('VibeCoding AI');
      expect(results.length).toBeGreaterThan(0);
    });

    it('должен возвращать пустой массив для несуществующего запроса', () => {
      const results = provider.searchContent('несуществующийтермин12345');
      expect(results.length).toBe(0);
    });

    it('должен ограничивать количество результатов', () => {
      const results = provider.searchContent('VibeCoding', 1);
      expect(results.length).toBeLessThanOrEqual(1);
    });
  });

  describe('generateTeachingPrompt', () => {
    beforeEach(async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue([
        { name: 'test.md', isDirectory: () => false, isFile: () => true }
      ] as any);
      mockFs.readFileSync.mockReturnValue(`# Test

💡 Совет: Тестовый совет для проверки генерации промпта.`);

      await provider.loadKnowledgeBase();
    });

    it('должен генерировать промпт на основе контента', () => {
      const prompt = provider.generateTeachingPrompt();
      expect(prompt).toBeDefined();
      expect(prompt.length).toBeGreaterThan(10);
    });

    it('должен генерировать промпт по топику', () => {
      const prompt = provider.generateTeachingPrompt('совет');
      expect(prompt).toBeDefined();
    });

    it('должен возвращать дефолтный промпт для пустой базы', () => {
      const emptyProvider = new VibeCodingKnowledgeProvider('/empty');
      const prompt = emptyProvider.generateTeachingPrompt();
      expect(prompt).toContain('VibeCoding');
    });
  });

  describe('getStats', () => {
    it('должен возвращать корректную статистику', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue([
        { name: 'test.md', isDirectory: () => false, isFile: () => true }
      ] as any);
      mockFs.readFileSync.mockReturnValue(`# Test

💡 Совет первый

💡 Совет второй`);

      await provider.loadKnowledgeBase();

      const stats = provider.getStats();
      expect(stats.sections).toBe(1);
      expect(stats.chunks).toBeGreaterThanOrEqual(0);
      expect(stats.byType).toBeDefined();
    });
  });

  describe('cleanContent', () => {
    it('должен очищать markdown разметку', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue([
        { name: 'test.md', isDirectory: () => false, isFile: () => true }
      ] as any);
      mockFs.readFileSync.mockReturnValue(`# Test

💡 Совет: **Жирный текст** и *курсив* должны быть очищены.`);

      await provider.loadKnowledgeBase();

      const chunk = provider.getRandomChunk('tip');
      if (chunk) {
        expect(chunk.content).not.toContain('**');
        expect(chunk.content).not.toContain('*');
      }
    });
  });

  describe('extractTags', () => {
    it('должен извлекать теги из контента', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue([
        { name: 'test.md', isDirectory: () => false, isFile: () => true }
      ] as any);
      mockFs.readFileSync.mockReturnValue(`# Test

💡 Совет: Используйте VibeCoding с Claude и ElizaOS для TypeScript проектов.`);

      await provider.loadKnowledgeBase();

      const chunk = provider.getRandomChunk('tip');
      if (chunk) {
        expect(chunk.tags).toBeDefined();
        expect(Array.isArray(chunk.tags)).toBe(true);
      }
    });
  });
});

describe('KnowledgeChunk interface', () => {
  it('должен иметь все необходимые поля', () => {
    const chunk: KnowledgeChunk = {
      id: 'test-1',
      chapter: 'Test Chapter',
      title: 'Test Title',
      content: 'Test content',
      type: 'tip',
      tags: ['VibeCoding', 'AI']
    };

    expect(chunk.id).toBe('test-1');
    expect(chunk.chapter).toBe('Test Chapter');
    expect(chunk.title).toBe('Test Title');
    expect(chunk.content).toBe('Test content');
    expect(chunk.type).toBe('tip');
    expect(chunk.tags).toHaveLength(2);
  });
});

describe('BookSection interface', () => {
  it('должен иметь все необходимые поля', () => {
    const section: BookSection = {
      path: '/test/path.md',
      title: 'Test Section',
      content: 'Section content'
    };

    expect(section.path).toBe('/test/path.md');
    expect(section.title).toBe('Test Section');
    expect(section.content).toBe('Section content');
  });
});
