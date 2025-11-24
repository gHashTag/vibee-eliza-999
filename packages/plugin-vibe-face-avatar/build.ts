#!/usr/bin/env bun
/**
 * Build script for @elizaos/plugin-vibe-face-avatar using standardized build utilities
 */

import { createBuildRunner } from '../../build-utils';

// Create and run the standardized build runner
const run = createBuildRunner({
  packageName: '@elizaos/plugin-vibe-face-avatar',
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
      '@fal-ai/client',
      '@infisical/sdk',
      'better-sqlite3',
      'cors',
      'drizzle-orm',
      'drizzle-zod',
      'express',
      'multer',
      'postgres',
      'replicate',
    ],
    sourcemap: true,
    minify: false,
    generateDts: true,
  },
});

// Execute the build
run().catch((error) => {
  console.error('Build script error:', error);
  process.exit(1);
});
