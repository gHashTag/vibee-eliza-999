#!/usr/bin/env node

/**
 * Скрипт экспорта агентов из TypeScript в JSON
 * Преобразует агентов из packages/agents/ в JSON файлы для ElizaOS
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Читаем агентов из JSON файлов (они уже есть!)
const agentsDir = path.join(__dirname, '../packages/agents');
const jsonFiles = ['vibeeAgent.json', 'neuroPhoto.json', 'instagramExpert.json', 'kolsAgent.json'];

try {
  console.log('Экспорт агентов из JSON файлов...\n');

  const outputDir = path.join(__dirname, '../agents-json');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const agents = {
    'vibeeAgent.json': { name: 'VIBEE', output: 'vibee.json' },
    'neuroPhoto.json': { name: 'Нейрофото', output: 'neurophoto.json' },
    'instagramExpert.json': { name: 'Instagram Expert', output: 'instagram-expert.json' },
    'kolsAgent.json': { name: 'KOLS Agent', output: 'kols-agent.json' }
  };

  Object.entries(agents).forEach(([jsonFile, info]) => {
    const jsonPath = path.join(agentsDir, jsonFile);

    if (!fs.existsSync(jsonPath)) {
      console.log(`⚠️  Файл не найден: ${jsonFile}`);
      return;
    }

    const content = fs.readFileSync(jsonPath, 'utf8');
    const agentData = JSON.parse(content);

    // Убеждаемся, что у агента есть name
    if (!agentData.name) {
      agentData.name = info.name;
    }

    const outputPath = path.join(outputDir, info.output);
    fs.writeFileSync(outputPath, JSON.stringify(agentData, null, 2));
    console.log(`✓ Сохранен: ${info.output} (${info.name})`);
  });

  console.log('\n✅ Все агенты экспортированы в папку agents-json/');
  console.log('\n📋 Для запуска агента используйте:');
  console.log('  elizaos agent start --path agents-json/vibee.json');
  console.log('\n📋 Для просмотра списка агентов:');
  console.log('  elizaos agent list');

} catch (error) {
  console.error('❌ Ошибка при экспорте агентов:', error.message);
  process.exit(1);
}
