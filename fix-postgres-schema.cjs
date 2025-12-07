/**
 * ВРЕМЕННЫЙ ПАТЧ для @elizaos/server
 * Исправляет проблему с CREATE SCHEMA IF NOT EXISTS в PostgreSQL
 */

const fs = require('fs');
const path = require('path');

// Находим файл server/dist/index.js
const serverFile = path.join(__dirname, 'node_modules', '@elizaos', 'server', 'dist', 'index.js');

if (!fs.existsSync(serverFile)) {
    console.log('❌ @elizaos/server not found');
    process.exit(1);
}

console.log('📝 Reading server file...');
let content = fs.readFileSync(serverFile, 'utf8');

// Ищем и заменяем проблемную строку
const problematicLine = 'CREATE SCHEMA IF NOT EXISTS migrations';
const fixedLine = 'CREATE SCHEMA migrations';

if (content.includes(problematicLine)) {
    console.log('🔧 Applying patch:', problematicLine, '→', fixedLine);
    content = content.replace(
        new RegExp(problematicLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        fixedLine
    );

    fs.writeFileSync(serverFile, content);
    console.log('✅ Patch applied successfully!');
    console.log('');
    console.log('💡 Теперь можно запускать с PostgreSQL без ошибок');
} else {
    console.log('⚠️ Problematic line not found - maybe already patched?');
}

console.log('');
console.log('🔄 Restart agents to apply changes');
