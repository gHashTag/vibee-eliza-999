#!/usr/bin/env bun
/**
 * Self-contained build script for ElizaOS projects
 */

import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { $ } from 'bun';

async function cleanBuild(outdir = 'dist') {
  if (existsSync(outdir)) {
    await rm(outdir, { recursive: true, force: true });
    console.log(`✓ Cleaned ${outdir} directory`);
  }
}

async function build() {
  const start = performance.now();
  console.log('🚀 Building project...');

  try {
    // Clean previous build
    await cleanBuild('dist');

    // Run JavaScript build and TypeScript declarations in parallel
    console.log('Starting build tasks...');

    const [buildResult, tscResult] = await Promise.all([
      // Task 1: Build with Bun
      (async () => {
        console.log('📦 Bundling with Bun...');
        const result = await Bun.build({
          entrypoints: ['./src/index.ts'],
          outdir: './dist',
          target: 'node',
          format: 'esm',
          sourcemap: true,
          minify: false,
          external: [
            'dotenv',
            'fs',
            'path',
            'https',
            'node:*',
            '@elizaos/core',
            '@elizaos/plugin-bootstrap',
            '@elizaos/plugin-sql',
            '@elizaos/cli',
            'zod',
          ],
          naming: {
            entry: '[dir]/[name].[ext]',
          },
        });

        if (!result.success) {
          console.error('✗ Build failed:', result.logs);
          return { success: false, outputs: [] };
        }

        const totalSize = result.outputs.reduce((sum, output) => sum + output.size, 0);
        const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
        console.log(`✓ Built ${result.outputs.length} file(s) - ${sizeMB}MB`);

        return result;
      })(),

      // Task 2: Generate TypeScript declarations
      (async () => {
        console.log('📝 Generating TypeScript declarations...');
        try {
          await $`tsc --emitDeclarationOnly --incremental --project ./tsconfig.build.json`.quiet();
          console.log('✓ TypeScript declarations generated');
          return { success: true };
        } catch (error) {
          console.warn('⚠ Failed to generate TypeScript declarations');
          console.warn('  This is usually due to test files or type errors.');
          return { success: false };
        }
      })(),
    ]);

    if (!buildResult.success) {
      return false;
    }

    // Task 3: Build E2E tests for elizaos test runner
    console.log('🧪 Building E2E tests...');
    try {
      const { mkdir } = await import('node:fs/promises');
      await mkdir('./dist/__tests__/e2e', { recursive: true });

      // Собираем все e2e тесты (главный проект + плагины)
      const e2eEntrypoints = [
        './src/__tests__/e2e/project-starter.e2e.ts',
        './src/instagram-plugin/__tests__/e2e/instagramPlugin.e2e.ts',
        './plugin-vibe-face-avatar/src/__tests__/e2e/plugin-starter.e2e.ts',
        './plugin-telegram-craft/src/__tests__/e2e/telegram-craft.e2e.ts',
        './plugin-carusel/src/__tests__/e2e/plugin-starter.e2e.ts',
      ].filter((file) => existsSync(file));

      const e2eResult = await Bun.build({
        entrypoints: e2eEntrypoints,
        outdir: './dist/__tests__/e2e',
        target: 'node',
        format: 'esm',
        external: ['@elizaos/*', 'uuid'],
      });

      if (e2eResult.success) {
        console.log(`✓ E2E tests compiled (${e2eEntrypoints.length} files)`);
      } else {
        console.warn('⚠ E2E tests compilation failed');
      }
    } catch (e) {
      console.warn('⚠ E2E tests compilation skipped');
    }

    const elapsed = ((performance.now() - start) / 1000).toFixed(2);
    console.log(`✅ Build complete! (${elapsed}s)`);
    return true;
  } catch (error) {
    console.error('Build error:', error);
    return false;
  }
}

// Execute the build
build()
  .then((success) => {
    if (!success) {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('Build script error:', error);
    process.exit(1);
  });
