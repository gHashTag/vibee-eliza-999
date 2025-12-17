/**
 * PromptEnhancerService
 *
 * Сервис для улучшения промптов изображений с помощью RAG.
 * Использует knowledge base с гайдами по Flux, DALL-E 3, Midjourney.
 *
 * Алгоритм:
 * 1. Загружает гайды из knowledge-base/photo-prompting/
 * 2. Передаёт контекст гайдов + пользовательский промпт в LLM
 * 3. LLM улучшает промпт с учётом лучших практик
 */

import { IAgentRuntime, logger, ModelType } from '@elizaos/core';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Логгер для PromptEnhancerService
 */
const log = {
  info: (msg: string) => logger.info(`[PromptEnhancer] ${msg}`),
  warn: (msg: string) => logger.warn(`[PromptEnhancer] ${msg}`),
  error: (msg: string, err?: unknown) => logger.error(`[PromptEnhancer] ${msg}: ${err}`),
  debug: (msg: string) => logger.debug(`[PromptEnhancer] ${msg}`),
};

/**
 * Путь к knowledge base с гайдами по промптингу
 */
const KNOWLEDGE_BASE_PATH = path.join(process.cwd(), 'knowledge-base', 'photo-prompting');

/**
 * Системный промпт для улучшения промптов
 */
const ENHANCE_SYSTEM_PROMPT = `You are an expert prompt engineer for AI image generation.
Your task is to enhance user prompts to get better results from image generation models.

IMPORTANT RULES:
1. PRESERVE the original idea and intent of the user
2. ADD specific details: lighting, style, composition, atmosphere
3. USE descriptive language instead of generic words
4. OUTPUT must be in ENGLISH (better for image models)
5. OPTIMAL LENGTH: 40-80 words
6. DO NOT add people if not in original prompt
7. DO NOT change the main subject
8. DO NOT use negative prompts (no "without", "no", etc.)

Your knowledge base includes best practices from:
- Flux: HEX colors, dual encoder, structure [Subject] + [Action] + [Style] + [Context]
- DALL-E 3: descriptive prompts, spatial relations, natural language
- Midjourney: artistic styles, parameters, mood descriptions

RESPOND WITH ONLY THE ENHANCED PROMPT, nothing else.`;

/**
 * Singleton сервис для улучшения промптов
 */
export class PromptEnhancerService {
  private static instance: PromptEnhancerService | null = null;
  private guidesContext: string = '';
  private isLoaded = false;

  private constructor() {}

  /**
   * Получить единственный экземпляр сервиса
   */
  static getInstance(): PromptEnhancerService {
    if (!PromptEnhancerService.instance) {
      PromptEnhancerService.instance = new PromptEnhancerService();
    }
    return PromptEnhancerService.instance;
  }

  /**
   * Загрузить гайды из knowledge base
   * Извлекает ключевые секции для экономии токенов
   */
  async loadGuides(): Promise<void> {
    if (this.isLoaded) {
      log.debug('Гайды уже загружены');
      return;
    }

    try {
      const guideFiles = ['flux-guide.md', 'dalle3-guide.md'];
      const sections: string[] = [];

      for (const file of guideFiles) {
        const filePath = path.join(KNOWLEDGE_BASE_PATH, file);

        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          // Извлекаем ключевые секции для экономии токенов
          const extracted = this.extractKeySections(content, file);
          sections.push(extracted);
          log.debug(`Загружен гайд: ${file}`);
        } else {
          log.warn(`Файл не найден: ${filePath}`);
        }
      }

      this.guidesContext = sections.join('\n\n---\n\n');
      this.isLoaded = true;
      log.info(`Загружено ${guideFiles.length} гайдов (${this.guidesContext.length} символов)`);
    } catch (error) {
      log.error('Ошибка загрузки гайдов', error);
    }
  }

  /**
   * Извлечь ключевые секции из гайда
   * Уменьшает размер контекста, сохраняя важную информацию
   */
  private extractKeySections(content: string, filename: string): string {
    const sections: string[] = [];

    // Заголовок
    sections.push(`### ${filename.replace('.md', '').toUpperCase()}`);

    // Структура промпта
    const structureMatch = content.match(/## Структура промпта[\s\S]*?(?=\n## |$)/);
    if (structureMatch) {
      sections.push(structureMatch[0].substring(0, 500));
    }

    // Стилевые ключевые слова
    const stylesMatch = content.match(/## Стилевые ключевые слова[\s\S]*?(?=\n## |$)/);
    if (stylesMatch) {
      sections.push(stylesMatch[0].substring(0, 800));
    }

    // Освещение
    const lightingMatch = content.match(/## Освещение[\s\S]*?(?=\n## |$)/);
    if (lightingMatch) {
      sections.push(lightingMatch[0].substring(0, 600));
    }

    // Примеры промптов (берём 2-3)
    const examplesMatch = content.match(/## Примеры промптов[\s\S]*?(?=\n## |$)/);
    if (examplesMatch) {
      sections.push(examplesMatch[0].substring(0, 1000));
    }

    // Лучшие практики
    const bestPracticesMatch = content.match(/## Лучшие практики[\s\S]*?(?=\n## |$)/);
    if (bestPracticesMatch) {
      sections.push(bestPracticesMatch[0].substring(0, 500));
    }

    return sections.join('\n\n');
  }

  /**
   * Улучшить пользовательский промпт через LLM
   *
   * @param userPrompt - Исходный промпт от пользователя
   * @param runtime - ElizaOS runtime для доступа к LLM
   * @returns Улучшенный промпт на английском
   */
  async enhancePrompt(userPrompt: string, runtime: IAgentRuntime): Promise<string> {
    // Загружаем гайды если ещё не загружены
    await this.loadGuides();

    // Если контекст пустой, возвращаем оригинальный промпт
    if (!this.guidesContext) {
      log.warn('Контекст гайдов пустой, возвращаем оригинальный промпт');
      return userPrompt;
    }

    try {
      const fullPrompt = `${ENHANCE_SYSTEM_PROMPT}

KNOWLEDGE BASE EXCERPTS:
${this.guidesContext}

USER PROMPT TO ENHANCE:
"${userPrompt}"

ENHANCED PROMPT:`;

      log.debug(`Улучшаю промпт: "${userPrompt.substring(0, 50)}..."`);

      // Используем LLM через runtime.useModel
      const response = await runtime.useModel(ModelType.TEXT_SMALL, {
        prompt: fullPrompt,
        maxTokens: 200,
        temperature: 0.7,
      });

      // Извлекаем текст из ответа
      const enhancedPrompt = typeof response === 'string'
        ? response.trim()
        : (response as any)?.content?.trim() || (response as any)?.text?.trim();

      if (!enhancedPrompt) {
        log.warn('Пустой ответ от LLM, возвращаем оригинальный промпт');
        return userPrompt;
      }

      // Очищаем от возможных кавычек в начале/конце
      const cleaned = enhancedPrompt.replace(/^["']|["']$/g, '');

      log.info(`Промпт улучшен: "${userPrompt.substring(0, 30)}..." → "${cleaned.substring(0, 50)}..."`);

      return cleaned;
    } catch (error) {
      log.error('Ошибка улучшения промпта', error);
      // При ошибке возвращаем оригинальный промпт
      return userPrompt;
    }
  }

  /**
   * Проверить, загружены ли гайды
   */
  isReady(): boolean {
    return this.isLoaded && this.guidesContext.length > 0;
  }

  /**
   * Получить размер загруженного контекста
   */
  getContextSize(): number {
    return this.guidesContext.length;
  }
}

/**
 * Глобальный экземпляр для удобства
 */
export const promptEnhancer = PromptEnhancerService.getInstance();
