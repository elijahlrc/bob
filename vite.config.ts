import preact from '@preact/preset-vite';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vitest/config';

/** Dev server only: the tree editor (tree-editor.html) saves its patch through here. */
function treeEditSave(): Plugin {
  return {
    name: 'tree-edit-save',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__tree-edits', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('POST only');
          return;
        }
        let body = '';
        req.on('data', (c) => (body += c));
        req.on('end', () => {
          try {
            const patch = JSON.parse(body) as { version?: number };
            if (patch.version !== 1) throw new Error('not a tree edit file');
            writeFileSync(
              resolve(import.meta.dirname, 'src/data/tree/treeEdits.json'),
              JSON.stringify(patch, null, 2) + '\n',
            );
            res.end('ok');
          } catch (e) {
            res.statusCode = 400;
            res.end(String(e));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [preact(), treeEditSave()],
  // Relative asset paths so `dist/` works when hosted under a sub-path (e.g. GitHub Pages).
  base: './',
  // The commit a build was made from (set by the deploy workflow), so run statistics can be told apart by balance version.
  define: { __BUILD_ID__: JSON.stringify(process.env.GITHUB_SHA?.slice(0, 7) ?? 'local') },
  server: {
    port: 5173,
    strictPort: true,
  },
  // Pre-bundle Preact and its hooks together so the dev server never serves two copies.
  optimizeDeps: { include: ['preact', 'preact/hooks', 'preact/jsx-runtime', 'phaser'] },
  build: {
    // Phaser alone is ~1.2 MB minified; don't warn about the engine chunk.
    chunkSizeWarningLimit: 2000,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    // The timing tests (the sim speed floors) need cores to themselves: on a machine with many cores, one worker per core
    // starves them. Eight is as fast overall.
    maxWorkers: 8,
    // Many tests play whole bot campaigns: a second or two here, several times that on a slow or busy machine.
    testTimeout: 60000,
  },
});
