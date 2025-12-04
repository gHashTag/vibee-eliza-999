/**
 * KOLS Learning Service
 * Единый сервис для обучения студентов VibeCoding
 */
import { Service, IAgentRuntime } from '@elizaos/core';
import fs from 'fs';
import path from 'path';
import { IKolsLearningTip } from '../types';

export class KolsLearningService extends Service {
  static serviceType = 'kols-learning';
  serviceType = 'kols-learning';

  /**
   * Статический метод start() - требуется ElizaOS
   */
  static async start(runtime: IAgentRuntime): Promise<Service> {
    const service = new KolsLearningService();
    await service.initialize(runtime);
    return service;
  }

  /**
   * Статический метод stop() - требуется ElizaOS
   */
  static async stop(runtime: IAgentRuntime): Promise<void> {
    console.log('🛑 [KolsLearningService] static stop() called');
  }

  private knowledgePath = '/Users/playra/vibee-agent/docs';
  private learningTips: IKolsLearningTip[] = [];

  async initialize(runtime: IAgentRuntime): Promise<void> {
    console.log('🎓 [KolsLearningService] Инициализация обучения...');
    await this.loadLearningTips();
    console.log(`✅ [KolsLearningService] Загружено ${this.learningTips.length} обучающих советов`);
  }

  /**
   * Загружает обучающие советы
   */
  private async loadLearningTips(): Promise<void> {
    try {
      // Основные советы по VibeCoding
      this.learningTips = [
        {
          title: 'Что такое VibeCoding?',
          content: 'VibeCoding - это новый подход к программированию, где AI-агенты становятся вашими напарниками в создании кода. Вместо того чтобы писать код вручную, вы общаетесь с AI на естественном языке, а он помогает вам создавать, отлаживать и улучшать программы.',
          why: 'Это позволяет сосредоточиться на решении проблем, а не на синтаксисе и рутинных задачах.',
          practicalTip: 'Начните с простых проектов: попросите AI создать функцию, затем улучшить её, добавить тесты.',
          topic: 'basics'
        },
        {
          title: 'Claude Code - ваш главный инструмент',
          content: 'Claude Code - это CLI инструмент от Anthropic для работы с AI-агентами прямо в терминале. Он понимает контекст вашего проекта и может редактировать файлы, запускать команды, создавать новые компоненты.',
          why: 'Повышает продуктивность в 3-5 раз за счет автоматизации рутинных задач программирования.',
          practicalTip: 'Установите Claude Code и попробуйте команду: "Создай React компонент кнопки" - увидите магию!',
          topic: 'tools'
        },
        {
          title: 'Что такое AI-агенты?',
          content: 'AI-агенты - это автономные программы, которые могут воспринимать окружающую среду, принимать решения и действовать для достижения целей. В контексте VibeCoding, это AI-помощники, которые понимают ваш код и могут его улучшать.',
          why: 'Позволяют делегировать рутинные задачи программирования и сосредоточиться на архитектуре и решениях.',
          practicalTip: 'Начните с простого агента: попросите его анализировать ваш код и предлагать улучшения.',
          topic: 'agents'
        },
        {
          title: 'Принцип "7 раз отмерь, один раз отрежь"',
          content: 'Перед написанием кода тщательно спланируйте архитектуру. AI-агенты помогают не только писать код, но и проектировать систему. Обсудите с AI план, получите обратную связь, и только потом приступайте к реализации.',
          why: 'Хорошая архитектура экономит часы отладки и переписывания кода.',
          practicalTip: 'Перед началом проекта создайте диаграмму архитектуры вместе с AI и проверьте все сценарии использования.',
          topic: 'workflow'
        },
        {
          title: 'ElizaOS - платформа для создания агентов',
          content: 'ElizaOS - это фреймворк для создания AI-агентов. Он предоставляет инструменты для создания, управления и оркестрации множества агентов, каждый из которых решает свою задачу.',
          why: 'Позволяет создавать сложные системы из простых, переиспользуемых компонентов.',
          practicalTip: 'Изучите структуру агента: Character, Actions, Services, Providers - это 4 основных блока.',
          topic: 'platform'
        }
      ];

      // Пытаемся загрузить из Библии вайб-кодера если папка существует
      if (fs.existsSync(this.knowledgePath)) {
        await this.loadFromBibleFiles();
      }
    } catch (error) {
      console.error('❌ [KolsLearningService] Ошибка загрузки советов:', error);
    }
  }

  /**
   * Загружает дополнительные советы из файлов Библии
   */
  private async loadFromBibleFiles(): Promise<void> {
    try {
      console.log(`📂 [KolsLearningService] Сканирую папку: ${this.knowledgePath}`);

      const allFiles = this.getAllMarkdownFiles(this.knowledgePath);
      console.log(`📄 [KolsLearningService] Найдено файлов: ${allFiles.length}`);

      for (const filePath of allFiles) {
        const relativePath = path.relative(this.knowledgePath, filePath);
        const content = fs.readFileSync(filePath, 'utf-8');
        const chunks = this.extractUsefulChunks(content, relativePath);
        this.learningTips.push(...chunks);
      }

      console.log(`📚 [KolsLearningService] ✅ Загружено ВСЕГО ${this.learningTips.length} фрагментов из Библии`);
    } catch (error) {
      console.error('❌ [KolsLearningService] Ошибка загрузки из файлов:', error);
    }
  }

  /**
   * Рекурсивно находит все markdown файлы в папке
   */
  private getAllMarkdownFiles(dir: string): string[] {
    const results: string[] = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Рекурсивно сканируем подпапки
        results.push(...this.getAllMarkdownFiles(fullPath));
      } else if (stat.isFile() && item.endsWith('.md')) {
        results.push(fullPath);
      }
    }

    return results;
  }

  /**
   * Извлекает полезные фрагменты из markdown
   */
  private extractUsefulChunks(content: string, filename: string): IKolsLearningTip[] {
    const chunks: IKolsLearningTip[] = [];
    const sections = content.split(/^##\s+/m);

    for (const section of sections) {
      if (section.length < 50) continue;

      const lines = section.split('\n');
      const title = lines[0].replace(/^#+\s*/, '').trim();
      const body = lines.slice(1).join('\n').trim();

      if (body.length > 50) {
        chunks.push({
          title: `${title} (${filename})`,
          content: body, // Полный контент без обрезки
          why: 'Полезная информация из Библии вайб-кодера',
          practicalTip: 'Попробуйте применить это на практике',
          topic: 'bible'
        });
      }
    }

    return chunks; // Все фрагменты из файла (убран лимит)
  }

  /**
   * Получает случайный совет
   */
  getRandomLearningTip(): IKolsLearningTip {
    const randomIndex = Math.floor(Math.random() * this.learningTips.length);
    return this.learningTips[randomIndex];
  }

  /**
   * Получает советы по теме
   */
  getTipsByTopic(topic: string): IKolsLearningTip[] {
    return this.learningTips.filter(tip => tip.topic === topic);
  }

  /**
   * Форматирует совет для отправки в Telegram
   */
  formatLearningMessage(tip: IKolsLearningTip): string {
    return `🎓 **Урок VibeCoding: ${tip.title}**

${tip.content}

💡 **Почему это важно:** ${tip.why}

🚀 **Практический совет:** ${tip.practicalTip}

📖 Хотите узнать больше? Задайте вопрос!`;
  }

  get capabilityDescription(): string {
    return 'KOLS обучающий сервис - проактивное обучение студентов VibeCoding';
  }

  async stop(): Promise<void> {
    console.log('🛑 [KolsLearningService] Остановка...');
  }
}
