import preact from '@preact/preset-vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [preact()],
  // Relative asset paths so `dist/` works when hosted under a sub-path (e.g. GitHub Pages).
  base: './',
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
  },
});
