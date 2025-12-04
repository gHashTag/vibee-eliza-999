import { Service, IAgentRuntime } from '@elizaos/core';
import * as fs from 'fs';
import * as path from 'path';

export class VibeLearningService extends Service {
  static serviceType = 'vibe-learning';
  serviceType = 'vibe-learning';

  private knowledgePath = '/Users/playra/vibee-agent/docs';
  private learningTips: Array<{
    title: string;
    content: string;
    why: string;
    practicalTip: string;
    topic: string;
  }> = [];

  async initialize(runtime: IAgentRuntime): Promise<void> {
    console.log('🎓 [VibeLearningService] Инициализация...');
    await this.loadLearningTips();
    console.log(`✅ [VibeLearningService] Загружено ${this.learningTips.length} обучающих советов`);
  }

  /**
   * Загружает обучающие советы из Библии вайб-кодера
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
          why: 'Агенты могут работать 24/7, анализировать большие объемы кода и находить паттерны, которые человек мог пропустить.',
          practicalTip: 'Начните с простого агента: попросите AI проанализировать ваш код и предложить улучшения.',
          topic: 'agents'
        },
        {
          title: 'Мультиагентные системы',
          content: 'Это когда несколько AI-агентов работают вместе, каждый со своей специализацией. Например, один агент пишет код, другой проверяет тесты, третий занимается документацией.',
          why: 'Повышает качество и скорость разработки за счет параллельной работы и специализации.',
          practicalTip: 'Попробуйте создать команду из 2-3 агентов: "архитектор", "разработчик", "тестировщик".',
          topic: 'advanced'
        },
        {
          title: 'Паттерны agentic programming',
          content: 'Agentic programming - это подход, где вы проектируете систему как взаимодействие автономных агентов. Каждый агент имеет свои цели, может планировать действия и адаптироваться к изменениям.',
          why: 'Позволяет создавать сложные системы, которые масштабируются и адаптируются самостоятельно.',
          practicalTip: 'Начните с микро-агентов: один для форматирования кода, другой для оптимизации.',
          topic: 'patterns'
        },
        {
          title: 'RAG в контексте агентов',
          content: 'RAG (Retrieval-Augmented Generation) - это техника, где AI использует внешние знания при генерации ответов. В VibeCoding это может быть база знаний проекта, документация, примеры кода.',
          why: 'Повышает точность ответов агента за счет контекстуальных знаний, а не только общих данных.',
          practicalTip: 'Создайте базу знаний вашего проекта и подключите её к агенту для более точных советов.',
          topic: 'knowledge'
        },
        {
          title: 'Почему 85% AI-проектов проваливаются?',
          content: 'По статистике, 85% AI-проектов не доходят до продакшена. Основные причины: неправильные ожидания, недостаток данных, отсутствие четких метрик успеха, игнорирование limitations AI.',
          why: 'Важно понимать, где AI поможет, а где лучше использовать традиционные подходы.',
          practicalTip: 'Всегда начинайте с MVP, проверяйте гипотезы на маленьких задачах, измеряйте результат.',
          topic: 'reality'
        },
        {
          title: 'Claude Code vs традиционные IDE',
          content: 'Традиционные IDE (VS Code, PyCharm) - это инструменты для написания кода вручную. Claude Code - это партнер по программированию, который понимает контекст и может генерировать код.',
          why: 'Переход от "инструмента" к "партнеру" кардинально меняет процесс разработки.',
          practicalTip: 'Попробуйте решить одну задачу двумя способами: в VS Code и с Claude Code - почувствуйте разницу.',
          topic: 'tools'
        }
      ];

      // Дополнительные советы можно загружать из файлов
      await this.loadFromFiles();

    } catch (error) {
      console.error('❌ [VibeLearningService] Ошибка загрузки советов:', error);
    }
  }

  /**
   * Загружает дополнительные советы из файлов
   */
  private async loadFromFiles(): Promise<void> {
    try {
      const files = fs.readdirSync(this.knowledgePath);

      for (const file of files) {
        if (file.endsWith('.md')) {
          const filePath = path.join(this.knowledgePath, file);
          const content = fs.readFileSync(filePath, 'utf-8');

          // Извлекаем полезные фрагменты из файлов
          const chunks = this.extractUsefulChunks(content, file);
          this.learningTips.push(...chunks);
        }
      }
    } catch (error) {
      console.warn('⚠️ [VibeLearningService] Не удалось загрузить файлы:', error);
    }
  }

  /**
   * Извлекает полезные фрагменты из markdown файлов
   */
  private extractUsefulChunks(content: string, filename: string): Array<any> {
    const chunks = [];

    // Разбиваем на секции по заголовкам
    const sections = content.split(/\n##\s+/);

    for (let i = 1; i < sections.length; i++) {
      const section = sections[i];
      const lines = section.split('\n');
      const title = lines[0].trim();

      // Берем первые несколько параграфов
      const paragraphs = [];
      for (let j = 1; j < lines.length && paragraphs.length < 3; j++) {
        const line = lines[j].trim();
        if (line && !line.startsWith('#') && !line.startsWith('|')) {
          paragraphs.push(line);
        }
      }

      if (paragraphs.length > 0) {
        chunks.push({
          title: title,
          content: paragraphs.join(' ').substring(0, 500),
          why: 'Изучение актуального материала из Библии вайб-кодера',
          practicalTip: 'Попробуйте применить эти знания в своем проекте',
          topic: filename.toLowerCase()
        });
      }
    }

    return chunks.slice(0, 5); // Максимум 5 кусков из файла
  }

  /**
   * Получает случайный совет для обучения
   */
  getRandomLearningTip(): { title: string; content: string; why: string; practicalTip: string; topic: string } {
    if (this.learningTips.length === 0) {
      // Fallback советы
      return {
        title: 'Начните с основ',
        content: 'VibeCoding - это новый подход к программированию с AI-агентами',
        why: 'Важно понимать основы перед переходом к сложным техникам',
        practicalTip: 'Установите Claude Code и попробуйте создать простой проект',
        topic: 'basics'
      };
    }

    const randomIndex = Math.floor(Math.random() * this.learningTips.length);
    return this.learningTips[randomIndex];
  }

  /**
   * Получает советы по определенной теме
   */
  getTipsByTopic(topic: string): Array<any> {
    return this.learningTips.filter(tip =>
      tip.topic.toLowerCase().includes(topic.toLowerCase())
    );
  }

  /**
   * Описание сервиса
   */
  get capabilityDescription(): string {
    return 'Сервис проактивного обучения VibeCoding - обучает студентов с помощью Библии вайб-кодера';
  }

  /**
   * Остановка сервиса
   */
  async stop(): Promise<void> {
    console.log('🛑 [VibeLearningService] Остановка сервиса...');
  }
}
