#!/usr/bin/env npx ts-node
/**
 * Скрипт генерации embeddedKnowledge.json
 *
 * Читает все .md файлы из knowledge-base/Agentic Vibecoding/
 * и генерирует JSON файл с чанками для встраивания в плагин.
 *
 * Запуск: npx ts-node scripts/generate-knowledge.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// Пути - используем абсолютные пути для надёжности
const VIBEE_AGENT_ROOT = '/Users/playra/vibee-agent';
const KNOWLEDGE_BASE_PATH = path.join(VIBEE_AGENT_ROOT, 'knowledge-base/Agentic Vibecoding');
const OUTPUT_PATH = path.join(VIBEE_AGENT_ROOT, 'plugin-kols-userbot/src/knowledge/embeddedKnowledge.json');

// Типы
interface KnowledgeChunk {
  id: string;
  chapter: string;
  title: string;
  content: string;
  type: 'concept' | 'tip' | 'example' | 'question' | 'exercise';
  tags: string[];
}

interface EmbeddedKnowledge {
  version: string;
  generatedAt: string;
  sourceDir: string;
  totalFiles: number;
  totalChunks: number;
  chunks: KnowledgeChunk[];
}

// Паттерны для определения типа контента
const TYPE_PATTERNS = {
  concept: [
    /^#{1,3}\s*(Что такое|Определение|Понятие|Концепция)/i,
    /^#{1,3}\s*(What is|Definition|Concept)/i
  ],
  tip: [
    /💡|💎|🔥|✨/,
    /^#{1,3}\s*(Совет|Tip|Рекомендация|Pro tip)/i,
    /^>\s*💡/
  ],
  example: [
    /^#{1,3}\s*(Пример|Example|Примеры)/i,
    /```typescript|```javascript|```python/
  ],
  question: [
    /❓|🤔/,
    /^#{1,3}\s*(Вопрос|Question)/i,
    /\?$/
  ],
  exercise: [
    /📝|🏋️|💪/,
    /^#{1,3}\s*(Упражнение|Exercise|Задание|Практика)/i
  ]
};

// Теги для извлечения
const TAG_KEYWORDS = [
  'vibecoding', 'вайбкодинг', 'elizaos', 'claude', 'ai-агент',
  'typescript', 'javascript', 'plugin', 'плагин', 'service', 'сервис',
  'action', 'provider', 'runtime', 'llm', 'промпт', 'rag',
  'telegram', 'бот', 'mcp', 'hook', 'memory', 'память',
  'agent', 'агент', 'swarm', 'рой', 'автономный', 'проактивный'
];

/**
 * Рекурсивно получает все .md файлы из директории
 */
function getAllMarkdownFiles(dir: string): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) {
    console.error(`Директория не найдена: ${dir}`);
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...getAllMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Определяет тип контента по тексту
 */
function detectContentType(text: string): KnowledgeChunk['type'] {
  for (const [type, patterns] of Object.entries(TYPE_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return type as KnowledgeChunk['type'];
      }
    }
  }
  return 'concept'; // По умолчанию
}

/**
 * Извлекает теги из текста
 */
function extractTags(text: string): string[] {
  const lowerText = text.toLowerCase();
  return TAG_KEYWORDS.filter(keyword => lowerText.includes(keyword));
}

/**
 * Генерирует уникальный ID для чанка
 */
function generateChunkId(chapter: string, index: number): string {
  const hash = crypto.createHash('md5')
    .update(`${chapter}-${index}`)
    .digest('hex')
    .substring(0, 8);
  return `chunk-${hash}`;
}

/**
 * Разбивает markdown файл на чанки
 */
function parseMarkdownToChunks(filePath: string, chapter: string): KnowledgeChunk[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const chunks: KnowledgeChunk[] = [];

  // Разбиваем по заголовкам ## или ###
  const sections = content.split(/(?=^#{2,3}\s+)/m);

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i].trim();

    if (!section || section.length < 50) {
      continue; // Пропускаем слишком короткие секции
    }

    // Извлекаем заголовок
    const titleMatch = section.match(/^#{2,3}\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : `Секция ${i + 1}`;

    // Извлекаем контент (убираем заголовок)
    const contentText = section.replace(/^#{2,3}\s+.+$/m, '').trim();

    if (contentText.length < 30) {
      continue; // Пропускаем секции без контента
    }

    // Ограничиваем длину контента
    const truncatedContent = contentText.length > 2000
      ? contentText.substring(0, 2000) + '...'
      : contentText;

    chunks.push({
      id: generateChunkId(chapter, i),
      chapter,
      title,
      content: truncatedContent,
      type: detectContentType(section),
      tags: extractTags(section)
    });
  }

  return chunks;
}

/**
 * Основная функция генерации
 */
function generateKnowledge(): void {
  console.log('🚀 Генерация embeddedKnowledge.json...\n');

  // Проверяем существование директории
  if (!fs.existsSync(KNOWLEDGE_BASE_PATH)) {
    console.error(`❌ Директория knowledge base не найдена: ${KNOWLEDGE_BASE_PATH}`);
    process.exit(1);
  }

  // Получаем все файлы
  const files = getAllMarkdownFiles(KNOWLEDGE_BASE_PATH);
  console.log(`📂 Найдено файлов: ${files.length}`);

  if (files.length === 0) {
    console.error('❌ Не найдено .md файлов');
    process.exit(1);
  }

  // Обрабатываем файлы
  const allChunks: KnowledgeChunk[] = [];

  for (const file of files) {
    const relativePath = path.relative(KNOWLEDGE_BASE_PATH, file);
    const chapter = path.dirname(relativePath) || path.basename(file, '.md');

    console.log(`  📄 ${relativePath}`);

    const chunks = parseMarkdownToChunks(file, chapter);
    allChunks.push(...chunks);
  }

  console.log(`\n📊 Всего чанков: ${allChunks.length}`);

  // Статистика по типам
  const typeStats: Record<string, number> = {};
  for (const chunk of allChunks) {
    typeStats[chunk.type] = (typeStats[chunk.type] || 0) + 1;
  }
  console.log('📈 По типам:', typeStats);

  // Формируем итоговый объект
  const knowledge: EmbeddedKnowledge = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    sourceDir: KNOWLEDGE_BASE_PATH,
    totalFiles: files.length,
    totalChunks: allChunks.length,
    chunks: allChunks
  };

  // Записываем в файл
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(knowledge, null, 2), 'utf-8');

  const fileSizeKB = Math.round(fs.statSync(OUTPUT_PATH).size / 1024);
  console.log(`\n✅ Сохранено: ${OUTPUT_PATH}`);
  console.log(`📦 Размер: ${fileSizeKB} KB`);
}

// Запуск
generateKnowledge();
