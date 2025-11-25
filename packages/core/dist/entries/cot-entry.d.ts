/**
 * Chain of Thought Entry Pattern
 * Обработка сложных AI-задач с пошаговым рассуждением
 */
import type { ChainOfThoughtEntry } from './types';
/**
 * Процессор для Chain of Thought обработки
 */
export declare class ChainOfThoughtProcessor {
    /**
     * Обработка Chain of Thought задачи
     */
    process(entry: ChainOfThoughtEntry): Promise<ChainOfThoughtEntry>;
    /**
     * Выполнение одного шага рассуждения
     */
    private executeStep;
    /**
     * Выполнение действия
     */
    private performAction;
    /**
     * Генерация итогового ответа
     */
    private generateFinalAnswer;
    /**
     * Расчет уверенности в ответе
     */
    private calculateConfidence;
    /**
     * Оценка уверенности в шаге
     */
    private assessStepConfidence;
    /**
     * Генерация рассуждения
     */
    private generateReasoning;
    /**
     * Создание новой Chain of Thought задачи
     */
    static create(taskId: string, task: string, steps: string[]): ChainOfThoughtEntry;
    /**
     * Добавление шага к существующей задаче
     */
    static addStep(entry: ChainOfThoughtEntry, stepDescription: string): ChainOfThoughtEntry;
}
//# sourceMappingURL=cot-entry.d.ts.map