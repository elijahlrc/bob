import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset paths so `dist/` works when hosted under a sub-path (e.g. GitHub Pages).
  base: './',
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    // Phaser alone is ~1.2 MB minified; don't warn about the engine chunk.
    chunkSizeWarningLimit: 2000,
  },
});
