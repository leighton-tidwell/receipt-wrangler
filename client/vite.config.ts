import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [preact(mode === 'development' ? {
    babel: {
      plugins: [
        ['@babel/plugin-transform-react-jsx', {
          runtime: 'automatic',
          importSource: 'preact',
        }],
      ],
    },
  } : {})],
  build: {
    outDir: '../dist/client',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, '../shared'),
      // Use root preact to match SSR (avoid multiple Preact instances)
      'preact': resolve(__dirname, '../node_modules/preact'),
      'preact/hooks': resolve(__dirname, '../node_modules/preact/hooks'),
      'preact/jsx-runtime': resolve(__dirname, '../node_modules/preact/jsx-runtime'),
      'preact/jsx-dev-runtime': resolve(__dirname, '../node_modules/preact/jsx-runtime'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/upload': 'http://localhost:3000',
    },
  },
}));
