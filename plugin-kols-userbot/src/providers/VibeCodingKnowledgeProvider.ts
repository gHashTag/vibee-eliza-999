/**
 * VibeCoding Knowledge Provider
 * Загружает и предоставляет контент из книги "Agentic Vibecoding"
 * для проактивного обучения пользователей
 */

import { Provider, IAgentRuntime, Memory, State } from '@elizaos/core';
import * as fs from 'fs';
import * as path from 'path';

export interface KnowledgeChunk {
  id: string;
  chapter: string;
  title: string;
  content: string;
  type: 'concept' | 'tip' | 'example' | 'question' | 'exercise';
  tags: string[];
}

export interface BookSection {
  path: string;
  title: string;
  content: string;
}

export class VibeCodingKnowledgeProvider {
  private chunks: KnowledgeChunk[] = [];
  private sections: BookSection[] = [];
  private isLoaded = false;
  private knowledgeBasePath: string;

  constructor(basePath?: string) {
    this.knowledgeBasePath = basePath || 
      path.join(process.cwd(), 'knowledge-base', 'Agentic Vibecoding');
  }

  /**
   * Загружает все markdown файлы из knowledge base
   */
  async loadKnowledgeBase(): Promise<void> {
    if (this.isLoaded) return;

    console.log(`📚 [VibeCodingKnowledgeProvider] Загрузка книги из ${this.knowledgeBasePath}`);

    try {
      await this.loadSectionsRecursively(this.knowledgeBasePath);
      this.parseChunks();
      this.isLoaded = true;
      console.log(`✅ [VibeCodingKnowledgeProvider] Загружено ${this.sections.length} секций, ${this.chunks.length} чанков`);
    } catch (error) {
      console.error(`❌ [VibeCodingKnowledgeProvider] Ошибка загрузки:`, error);
    }
  }

  /**
   * Рекурсивно загружает markdown файлы
   */
  private async loadSectionsRecursively(dirPath: string): Promise<void> {
    if (!fs.existsSync(dirPath)) {
      console.warn(`⚠️ [VibeCodingKnowledgeProvider] Директория не найдена: ${dirPath}`);
      return;
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        await this.loadSectionsRecursively(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const title = this.extractTitle(content, entry.name);
          
          this.sections.push({
            path: fullPath,
            title,
            content
          });
        } catch (error) {
          console.warn(`⚠️ Не удалось прочитать ${fullPath}`);
        }
      }
    }
  }

  /**
   * Извлекает заголовок из markdown
   */
  private extractTitle(content: string, filename: string): string {
    const headerMatch = content.match(/^#\s+(.+)$/m);
    if (headerMatch) {
      return headerMatch[1].replace(/[🎯📚💡🔥✅❌⚡🚀🤖💎🎓🌊]/g, '').trim();
    }
    return filename.replace('.md', '').replace(/-/g, ' ');
  }

  /**
   * Парсит контент на чанки для обучения
   */
  private parseChunks(): void {
    for (const section of this.sections) {
      // Извлекаем ключевые концепции
      const concepts = this.extractConcepts(section);
      this.chunks.push(...concepts);

      // Извлекаем советы
      const tips = this.extractTips(section);
      this.chunks.push(...tips);

      // Извлекаем примеры
      const examples = this.extractExamples(section);
      this.chunks.push(...examples);

      // Извлекаем вопросы для проверки
      const questions = this.extractQuestions(section);
      this.chunks.push(...questions);
    }
  }

  /**
   * Извлекает ключевые концепции
   */
  private extractConcepts(section: BookSection): KnowledgeChunk[] {
    const chunks: KnowledgeChunk[] = [];
    const content = section.content;

    // Ищем определения (### Что такое...)
    const conceptMatches = content.matchAll(/###\s+(Что такое|Ключевые|Принцип|Понятие|Определение).*?\n([\s\S]*?)(?=\n###|\n##|\n---|\n\*\*\*|$)/gi);
    
    for (const match of conceptMatches) {
      const text = match[2].trim();
      if (text.length > 50 && text.length < 2000) {
        chunks.push({
          id: `concept-${chunks.length}-${Date.now()}`,
          chapter: section.title,
          title: match[1],
          content: this.cleanContent(text),
          type: 'concept',
          tags: this.extractTags(text)
        });
      }
    }

    return chunks;
  }

  /**
   * Извлекает советы
   */
  private extractTips(section: BookSection): KnowledgeChunk[] {
    const chunks: KnowledgeChunk[] = [];
    const content = section.content;

    // Ищем советы (💡, Совет:, Tip:)
    const tipMatches = content.matchAll(/(?:💡|💎|🔥|Совет:|Tip:|Полезный совет:|Профессиональный совет:)\s*([\s\S]*?)(?=\n\n|\n###|\n##|$)/gi);
    
    for (const match of tipMatches) {
      const text = match[1].trim();
      if (text.length > 30 && text.length < 500) {
        chunks.push({
          id: `tip-${chunks.length}-${Date.now()}`,
          chapter: section.title,
          title: 'Совет',
          content: this.cleanContent(text),
          type: 'tip',
          tags: this.extractTags(text)
        });
      }
    }

    return chunks;
  }

  /**
   * Извлекает примеры кода и практики
   */
  private extractExamples(section: BookSection): KnowledgeChunk[] {
    const chunks: KnowledgeChunk[] = [];
    const content = section.content;

    // Ищем примеры (Пример:, Example:)
    const exampleMatches = content.matchAll(/(?:Пример\s*\d*:|Example:)\s*([\s\S]*?)(?=\n\n\n|\n###|\n##|$)/gi);
    
    for (const match of exampleMatches) {
      const text = match[1].trim();
      if (text.length > 50 && text.length < 1500) {
        chunks.push({
          id: `example-${chunks.length}-${Date.now()}`,
          chapter: section.title,
          title: 'Пример',
          content: this.cleanContent(text),
          type: 'example',
          tags: this.extractTags(text)
        });
      }
    }

    return chunks;
  }

  /**
   * Извлекает вопросы для проверки
   */
  private extractQuestions(section: BookSection): KnowledgeChunk[] {
    const chunks: KnowledgeChunk[] = [];
    const content = section.content;

    // Ищем вопросы (❓, Вопрос, ?)
    const questionMatches = content.matchAll(/(?:❓|Вопрос\s*\d*:?)\s*(.*?\?)/gi);
    
    for (const match of questionMatches) {
      const text = match[1].trim();
      if (text.length > 20 && text.length < 300) {
        chunks.push({
          id: `question-${chunks.length}-${Date.now()}`,
          chapter: section.title,
          title: 'Вопрос',
          content: this.cleanContent(text),
          type: 'question',
          tags: this.extractTags(text)
        });
      }
    }

    return chunks;
  }

  /**
   * Очищает контент от markdown разметки
   */
  private cleanContent(text: string): string {
    return text
      .replace(/```[\s\S]*?```/g, '[код]') // Заменяем код на плейсхолдер
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Убираем ссылки
      .replace(/[*_~`]/g, '') // Убираем форматирование
      .replace(/\n{3,}/g, '\n\n') // Нормализуем переносы
      .trim();
  }

  /**
   * Извлекает теги из текста
   */
  private extractTags(text: string): string[] {
    const keywords = [
      'VibeCoding', 'AI-агент', 'Claude', 'ElizaOS', 'TypeScript',
      'функциональное программирование', 'MTProto', 'Telegram',
      'TaskEither', 'pipe', 'автоматизация', 'архитектура',
      'мультиагент', 'RAG', 'LLM', 'prompt', 'контекст'
    ];

    return keywords.filter(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  /**
   * Получает случайный чанк для проактивного сообщения
   */
  getRandomChunk(type?: KnowledgeChunk['type']): KnowledgeChunk | null {
    if (!this.isLoaded) {
      console.warn('⚠️ Knowledge base не загружена');
      return null;
    }

    const filtered = type 
      ? this.chunks.filter(c => c.type === type)
      : this.chunks;

    if (filtered.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * filtered.length);
    return filtered[randomIndex];
  }

  /**
   * Получает случайную секцию книги
   */
  getRandomSection(): BookSection | null {
    if (!this.isLoaded || this.sections.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * this.sections.length);
    return this.sections[randomIndex];
  }

  /**
   * Поиск релевантного контента по запросу
   */
  searchContent(query: string, limit = 3): KnowledgeChunk[] {
    if (!this.isLoaded) return [];

    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

    return this.chunks
      .map(chunk => {
        const contentLower = chunk.content.toLowerCase();
        const titleLower = chunk.title.toLowerCase();
        
        let score = 0;
        for (const word of queryWords) {
          if (contentLower.includes(word)) score += 1;
          if (titleLower.includes(word)) score += 2;
          if (chunk.tags.some(t => t.toLowerCase().includes(word))) score += 3;
        }
        
        return { chunk, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.chunk);
  }

  /**
   * Генерирует обучающий промпт на основе контента книги
   */
  generateTeachingPrompt(topic?: string): string {
    const chunk = topic 
      ? this.searchContent(topic, 1)[0] 
      : this.getRandomChunk();

    if (!chunk) {
      return 'Расскажи о VibeCoding - подходе к разработке с AI-агентами.';
    }

    const prompts: Record<KnowledgeChunk['type'], string> = {
      concept: `Объясни студентам концепцию из главы "${chunk.chapter}": ${chunk.content}`,
      tip: `Поделись полезным советом из Библии VibeCoder: ${chunk.content}`,
      example: `Разбери практический пример из главы "${chunk.chapter}": ${chunk.content}`,
      question: `Задай студентам вопрос для проверки понимания: ${chunk.content}`,
      exercise: `Предложи упражнение по теме "${chunk.chapter}": ${chunk.content}`
    };

    return prompts[chunk.type] || `Расскажи о: ${chunk.content}`;
  }

  /**
   * Статистика knowledge base
   */
  getStats(): { sections: number; chunks: number; byType: Record<string, number> } {
    const byType: Record<string, number> = {};
    
    for (const chunk of this.chunks) {
      byType[chunk.type] = (byType[chunk.type] || 0) + 1;
    }

    return {
      sections: this.sections.length,
      chunks: this.chunks.length,
      byType
    };
  }
}

/**
 * ElizaOS Provider для интеграции с агентом
 */
export const vibeCodingKnowledgeProvider: Provider = {
  name: 'vibecoding-knowledge',
  description: 'Предоставляет знания из книги Agentic Vibecoding для обучения',

  async get(runtime: IAgentRuntime, message: Memory, state: State) {
    const provider = new VibeCodingKnowledgeProvider();
    await provider.loadKnowledgeBase();

    // Если есть текст сообщения - ищем релевантный контент
    const messageText = message.content?.text || '';
    
    if (messageText.length > 5) {
      const relevant = provider.searchContent(messageText, 2);
      if (relevant.length > 0) {
        const text = relevant.map(c => `[${c.chapter}] ${c.content}`).join('\n\n');
        return { text };
      }
    }

    // Иначе возвращаем случайный инсайт
    const chunk = provider.getRandomChunk();
    const text = chunk ? `[${chunk.chapter}] ${chunk.content}` : '';
    return { text };
  }
};

export default VibeCodingKnowledgeProvider;
