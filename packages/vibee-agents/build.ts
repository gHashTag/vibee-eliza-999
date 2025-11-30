import { build } from 'bun';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';

// Создаем dist/src директорию если её нет
if (!existsSync('dist/src')) {
  await mkdir('dist/src', { recursive: true });
}

await build({
  entrypoints: ['src/index.ts'],
  outdir: 'dist/src',
  target: 'node',
  format: 'esm',
  minify: false,
  sourcemap: true,
  external: [
    '@elizaos/core',
    '@elizaos/plugin-bootstrap',
    '@elizaos/plugin-sql',
    '@elizaos/plugin-telegram-craft',
    '@elizaos/plugin-vibe-face-avatar',
  ],
});

console.log('✅ VIBEE Agents build complete!');
console.log('📦 Output: dist/src/index.js');

