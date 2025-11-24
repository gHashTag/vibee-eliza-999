/**
 * Chain of Thought Entry Pattern
 * Обработка сложных AI-задач с пошаговым рассуждением
 */

import type {
  ChainOfThoughtEntry,
  CoTStep,
  ValidationResult,
} from './types';
import { validateChainOfThoughtEntry } from './validators';

/**
 * Процессор для Chain of Thought обработки
 */
export class ChainOfThoughtProcessor {
  /**
   * Обработка Chain of Thought задачи
   */
  async process(entry: ChainOfThoughtEntry): Promise<ChainOfThoughtEntry> {
    // Валидация входных данных
    const validation = validateChainOfThoughtEntry(entry);
    if (!validation.isValid) {
      throw new Error(
        `Invalid Chain of Thought entry: ${validation.errors.map(e => e.message).join(', ')}`
      );
    }

    console.log(`[CoTProcessor] Processing task ${entry.taskId}`);

    // Выполнение шагов рассуждения
    const steps: CoTStep[] = [];
    let accumulatedContext = '';

    for (let i = 0; i < entry.steps.length; i++) {
      const stepNumber = i + 1;
      console.log(`[CoTProcessor] Executing step ${stepNumber}/${entry.steps.length}`);

      // Выполнение шага
      const executedStep = await this.executeStep(entry.steps[i], stepNumber, accumulatedContext);
      steps.push(executedStep);

      // Обновление контекста
      accumulatedContext += `\nStep ${stepNumber}: ${executedStep.result}\n`;
    }

    // Генерация итогового ответа
    const finalAnswer = await this.generateFinalAnswer(steps, entry.task);

    // Расчет уверенности
    const confidence = this.calculateConfidence(steps);

    // Создание итогового рассуждения
    const reasoning = this.generateReasoning(steps);

    return {
      ...entry,
      steps,
      finalAnswer,
      confidence,
      reasoning,
      metadata: {
        ...entry.metadata,
        processedAt: Date.now(),
        totalSteps: steps.length,
        averageConfidence: steps.reduce((sum, s) => sum + s.confidence, 0) / steps.length,
      },
    };
  }

  /**
   * Выполнение одного шага рассуждения
   */
  private async executeStep(
    step: CoTStep,
    stepNumber: number,
    context: string
  ): Promise<CoTStep> {
    try {
      const startTime = Date.now();

      // Анализ мысли
      const thought = step.thought || `Step ${stepNumber}: Analyzing the current state`;

      // Выполнение действия
      const action = step.action || `Execute step ${stepNumber}`;
      const actionResult = await this.performAction(action, context);

      // Формирование результата
      const result = actionResult || `Completed step ${stepNumber}`;

      // Рассуждение о результате
      const reasoning = step.reasoning || `Step ${stepNumber} reasoning: ${result}`;

      // Расчет уверенности
      const confidence = this.assessStepConfidence(actionResult);

      const endTime = Date.now();

      return {
        stepNumber,
        thought,
        action,
        result,
        reasoning,
        confidence,
        timestamp: endTime - startTime,
      };
    } catch (error) {
      console.error(`[CoTProcessor] Error executing step ${stepNumber}:`, error);

      return {
        stepNumber,
        thought: step.thought || `Error at step ${stepNumber}`,
        action: step.action || `Failed action`,
        result: `Error: ${error instanceof Error ? error.message : String(error)}`,
        reasoning: `Step ${stepNumber} failed: ${error instanceof Error ? error.message : String(error)}`,
        confidence: 0,
        timestamp: 0,
      };
    }
  }

  /**
   * Выполнение действия
   */
  private async performAction(action: string, context: string): Promise<string> {
    // Базовая реализация выполнения действия
    // В реальной системе здесь будет интеграция с AI-моделями

    try {
      // Имитация обработки
      await new Promise(resolve => setTimeout(resolve, 100));

      // Простой анализ действия
      if (action.toLowerCase().includes('generate')) {
        return `Generated content based on: ${action}`;
      } else if (action.toLowerCase().includes('analyze')) {
        return `Analysis result for: ${action}`;
      } else if (action.toLowerCase().includes('process')) {
        return `Processing completed for: ${action}`;
      } else {
        return `Action executed: ${action}`;
      }
    } catch (error) {
      throw new Error(`Failed to perform action: ${action}. Error: ${error}`);
    }
  }

  /**
   * Генерация итогового ответа
   */
  private async generateFinalAnswer(steps: CoTStep[], task: string): Promise<string> {
    try {
      // Сбор всех результатов
      const results = steps.map(s => s.result).join('\n');

      // Формирование итогового ответа
      const finalAnswer = [
        `Task: ${task}`,
        '',
        'Solution Steps:',
        ...steps.map(s => `- ${s.result}`),
        '',
        'Final Answer:',
        `Based on the ${steps.length} steps above, the solution is provided.`,
      ].join('\n');

      return finalAnswer;
    } catch (error) {
      console.error('[CoTProcessor] Error generating final answer:', error);
      return 'Error generating final answer';
    }
  }

  /**
   * Расчет уверенности в ответе
   */
  private calculateConfidence(steps: CoTStep[]): number {
    if (steps.length === 0) return 0;

    // Усредненная уверенность по всем шагам
    const averageConfidence = steps.reduce((sum, s) => sum + s.confidence, 0) / steps.length;

    // Бонус за полноту шагов
    const completenessBonus = Math.min(steps.length / 10, 0.2);

    // Штраф за ошибки
    const errors = steps.filter(s => s.confidence < 0.5).length;
    const errorPenalty = errors * 0.1;

    // Итоговая уверенность
    const finalConfidence = Math.max(0, Math.min(1, averageConfidence + completenessBonus - errorPenalty));

    return Number(finalConfidence.toFixed(3));
  }

  /**
   * Оценка уверенности в шаге
   */
  private assessStepConfidence(result: string): number {
    // Простая эвристика оценки уверенности
    let confidence = 0.5;

    // Позитивные индикаторы
    if (result.includes('completed') || result.includes('success')) {
      confidence += 0.2;
    }
    if (result.includes('generated') || result.includes('analyzed')) {
      confidence += 0.15;
    }
    if (result.includes('processed') || result.includes('executed')) {
      confidence += 0.15;
    }

    // Негативные индикаторы
    if (result.includes('error') || result.includes('failed')) {
      confidence -= 0.3;
    }
    if (result.includes('unknown') || result.includes('uncertain')) {
      confidence -= 0.2;
    }

    // Ограничение диапазона
    confidence = Math.max(0, Math.min(1, confidence));

    return Number(confidence.toFixed(3));
  }

  /**
   * Генерация рассуждения
   */
  private generateReasoning(steps: CoTStep[]): string {
    const reasoningParts = [];

    reasoningParts.push(`Chain of Thought reasoning for ${steps.length} steps:`);

    for (const step of steps) {
      reasoningParts.push(
        `\nStep ${step.stepNumber}: ${step.reasoning} (confidence: ${(step.confidence * 100).toFixed(1)}%)`
      );
    }

    const totalConfidence = this.calculateConfidence(steps);
    reasoningParts.push(
      `\nOverall confidence: ${(totalConfidence * 100).toFixed(1)}%`
    );

    return reasoningParts.join('');
  }

  /**
   * Создание новой Chain of Thought задачи
   */
  static create(taskId: string, task: string, steps: string[]): ChainOfThoughtEntry {
    const cotSteps: CoTStep[] = steps.map((step, index) => ({
      stepNumber: index + 1,
      thought: `Step ${index + 1}: ${step}`,
      action: `Execute step ${index + 1}`,
      result: '',
      reasoning: `Reasoning for step ${index + 1}`,
      confidence: 0.5,
      timestamp: 0,
    }));

    return {
      taskId,
      task,
      steps: cotSteps,
      finalAnswer: '',
      confidence: 0,
      reasoning: '',
      metadata: {
        createdAt: Date.now(),
        stepCount: steps.length,
      },
    };
  }

  /**
   * Добавление шага к существующей задаче
   */
  static addStep(entry: ChainOfThoughtEntry, stepDescription: string): ChainOfThoughtEntry {
    const stepNumber = entry.steps.length + 1;

    const newStep: CoTStep = {
      stepNumber,
      thought: `Step ${stepNumber}: ${stepDescription}`,
      action: `Execute step ${stepNumber}`,
      result: '',
      reasoning: `Reasoning for step ${stepNumber}`,
      confidence: 0.5,
      timestamp: 0,
    };

    return {
      ...entry,
      steps: [...entry.steps, newStep],
    };
  }
}

// ===== ЭКСПОРТ =====

export { ChainOfThoughtProcessor };
