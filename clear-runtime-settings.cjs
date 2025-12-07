/**
 * Очистка настроек runtime
 */

const fs = require('fs');
const path = require('path');

// Пути к возможным файлам настроек
const possiblePaths = [
    path.join(__dirname, '.eliza', 'settings.json'),
    path.join(__dirname, '.eliza', 'runtime.json'),
    path.join(__dirname, 'data', 'settings.json'),
    path.join(__dirname, '.env.local'),
];

console.log('🔧 Searching for runtime settings files...\n');

let found = 0;
possiblePaths.forEach(filePath => {
    if (fs.existsSync(filePath)) {
        found++;
        console.log('✅ Found:', filePath);
        const content = fs.readFileSync(filePath, 'utf8');
        console.log('   Content:', content.substring(0, 200), '...\n');
    }
});

if (found === 0) {
    console.log('❌ No settings files found in standard locations');
    console.log('\n💡 Settings might be in:');
    console.log('   1. Database (SQLite/PostgreSQL)');
    console.log('   2. Runtime memory');
    console.log('   3. Character file settings');
    console.log('\n💡 Try clearing database:');
    console.log('   rm -f data/dev.sqlite');
}
