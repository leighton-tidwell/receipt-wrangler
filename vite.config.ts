import preact from '@preact/preset-vite';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  root: 'client',
  plugins: [
    preact(
      mode === 'development'
        ? {
            babel: {
              plugins: [
                [
                  '@babel/plugin-transform-react-jsx',
                  {
                    runtime: 'automatic',
                    importSource: 'preact',
                  },
                ],
              ],
            },
          }
        : {}
    ),
  ],
  build: {
    outDir: '../dist/client',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@/shared': resolve(__dirname, './shared'),
      '@/client': resolve(__dirname, './client/src'),
      '@/server': resolve(__dirname, './server'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/upload': 'http://localhost:3000',
    },
  },
}));
