#!/usr/bin/env bun
/**
 * Build script for @elizaos/plugin-telegram-craft using standardized build utilities
 */

import { createBuildRunner } from '../../build-utils';

// Create and run the standardized build runner
const run = createBuildRunner({
  packageName: '@elizaos/plugin-telegram-craft',
  buildOptions: {
    entrypoints: ['src/index.ts'],
    outdir: 'dist',
    target: 'node',
    format: 'esm',
    external: [
      'dotenv',
      'fs',
      'path',
      '@reflink/reflink',
      'agentkeepalive',
      'zod',
      '@elizaos/core',
      '@elizaos/plugin-sql',
      '@elizaos/plugin-openrouter',
      '@mtproto/core',
      '@tgsnake/core',
      'telegraf',
      'telegram',
    ],
    sourcemap: true,
    minify: false,
    generateDts: false, // Временно отключено для деплоя
  },
});

// Execute the build
run().catch((error) => {
  console.error('Build script error:', error);
  process.exit(1);
});
