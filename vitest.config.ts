import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@/server': fileURLToPath(new URL('./server', import.meta.url)),
      '@/client': fileURLToPath(new URL('./client', import.meta.url)),
      '@/shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
  test: {
    globals: false,
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules/**', 'dist/**'],
    setupFiles: ['./test/setup.ts'],
  },
});
