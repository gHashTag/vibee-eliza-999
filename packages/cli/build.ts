#!/usr/bin/env bun
/**
 * Build script for @elizaos/cli using standardized build utilities
 */

import { createBuildRunner, copyAssets } from './build-utils';
import { $ } from 'bun';
import { existsSync, statSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { BunPlugin } from 'bun';

// Custom pre-build step to copy templates and generate version
async function preBuild() {
  console.log('\nPre-build tasks...');
  const start = performance.now();

  // Run both pre-build tasks in parallel
  const [versionResult, templateResult] = await Promise.all([
    $`bun run src/scripts/generate-version.ts`
      .then(() => {
        const taskTime = ((performance.now() - start) / 1000).toFixed(2);
        console.log(`  ✓ Version file generated (${taskTime}s)`);
        return true;
      })
      .catch((err) => {
        console.error('  ✗ Version generation failed:', err);
        throw err;
      }),
    $`bun run src/scripts/copy-templates.ts`
      .then(() => {
        const taskTime = ((performance.now() - start) / 1000).toFixed(2);
        console.log(`  ✓ Templates copied (${taskTime}s)`);
        return true;
      })
      .catch((err) => {
        console.error('  ✗ Template copying failed:', err);
        throw err;
      }),
  ]);

  const elapsed = ((performance.now() - start) / 1000).toFixed(2);
  console.log(`✅ Pre-build tasks completed (${elapsed}s)`);
}

// Plugin to resolve @/ alias paths
const pathAliasPlugin: BunPlugin = {
  name: 'path-alias-resolver',
  setup(build) {
    build.onResolve({ filter: /^@\// }, (args) => {
      // args.path contains the full import path like "@/src/commands/agent"
      // We need to remove @/ and resolve relative to src/
      let relativePath = args.path.replace(/^@\//, '');

      // If the path already starts with src/, remove it to avoid duplication
      if (relativePath.startsWith('src/')) {
        relativePath = relativePath.replace(/^src\//, '');
      }

      const basePath = path.resolve(process.cwd(), 'src', relativePath);

      // First, try to find the file with common extensions
      const extensions = ['.ts', '.tsx', '.js', '.jsx'];
      for (const ext of extensions) {
        const fullPath = basePath + ext;
        if (existsSync(fullPath) && !statSync(fullPath).isDirectory()) {
          return {
            path: fullPath,
          };
        }
      }

      // If it's a directory, try to find index files
      if (existsSync(basePath) && statSync(basePath).isDirectory()) {
        for (const ext of ['.ts', '.tsx', '.js', '.jsx']) {
          const indexPath = path.join(basePath, 'index' + ext);
          if (existsSync(indexPath)) {
            return {
              path: indexPath,
            };
          }
        }
      }

      // If no file found, return the path as-is (Bun will handle the error)
      return {
        path: basePath,
      };
    });
  },
};

// Create and run the standardized build runner
const run = createBuildRunner({
  packageName: '@elizaos/cli',
  buildOptions: {
    entrypoints: ['src/index.ts'],
    outdir: 'dist',
    target: 'bun',
    format: 'esm',
    external: ['fs-extra', '@elizaos/server', 'chokidar', 'simple-git', 'tiktoken'],
    sourcemap: true,
    minify: false,
    isCli: true,
    generateDts: false, // Temporarily disabled due to path alias resolution issues in tsc
    plugins: [pathAliasPlugin],
    // Assets will be copied after build via onBuildComplete
  },
  onBuildComplete: async (success) => {
    if (success) {
      console.log('\nPost-build tasks...');
      const postBuildStart = performance.now();

      // Prepare all post-build tasks
      const postBuildTasks: Promise<void>[] = [];

      // Task 1: Copy templates
      postBuildTasks.push(
        copyAssets([{ from: './templates', to: './dist/templates' }])
          .then(() => console.log('  ✓ Templates copied to dist'))
          .catch((err) => {
            console.error('  ✗ Template copying failed:', err);
            throw err;
          })
      );

      // Task 2: Handle version file
      const versionSrcPath = './src/version.ts';
      const versionDistPath = './dist/version.js';
      postBuildTasks.push(
        (async () => {
          if (existsSync(versionSrcPath)) {
            // Read the TypeScript version file
            const versionContent = await fs.readFile(versionSrcPath, 'utf-8');
            // Convert to JavaScript by removing TypeScript-specific syntax
            const jsContent = versionContent
              .replace(/export const (\w+): string = /g, 'export const $1 = ')
              .replace(/export default {/, 'export default {');
            await fs.writeFile(versionDistPath, jsContent);
            console.log('  ✓ Version file copied to dist/version.js');
          } else {
            console.warn('  ⚠️  Version file not found at src/version.ts - generating fallback');
            // Generate a fallback version file if the source doesn't exist
            const fallbackContent = `export const CLI_VERSION = '0.0.0';
export const CLI_NAME = '@elizaos/cli';
export const CLI_DESCRIPTION = 'elizaOS CLI';
export default { version: '0.0.0', name: '@elizaos/cli', description: 'elizaOS CLI' };`;
            await fs.writeFile(versionDistPath, fallbackContent);
          }
        })()
      );

      // Execute all post-build tasks in parallel
      await Promise.all(postBuildTasks);

      const postBuildElapsed = ((performance.now() - postBuildStart) / 1000).toFixed(2);
      console.log(`✅ Post-build tasks completed (${postBuildElapsed}s)`);
    }
  },
});

// Execute the build with pre-build step
async function buildWithPreStep() {
  await preBuild();
  await run();
}

buildWithPreStep().catch((error) => {
  console.error('Build script error:', error);
  process.exit(1);
});
