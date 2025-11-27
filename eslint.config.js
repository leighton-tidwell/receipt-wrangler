// @ts-check
import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import noRelativeImportPaths from 'eslint-plugin-no-relative-import-paths';

export default defineConfig(
  {
    ignores: ['**/dist/**', '**/node_modules/**'],
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    plugins: {
      'no-relative-import-paths': noRelativeImportPaths,
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: ['server/**/*.ts', 'server/**/*.tsx'],
    rules: {
      'no-relative-import-paths/no-relative-import-paths': [
        'error',
        {
          allowSameFolder: false,
          rootDir: 'server',
          prefix: '@/server',
        },
      ],
    },
  },
  {
    files: ['shared/**/*.ts', 'shared/**/*.tsx'],
    rules: {
      'no-relative-import-paths/no-relative-import-paths': [
        'error',
        {
          allowSameFolder: false,
          rootDir: 'shared',
          prefix: '@/shared',
        },
      ],
    },
  },
  {
    files: ['client/src/**/*.ts', 'client/src/**/*.tsx'],
    rules: {
      'no-relative-import-paths/no-relative-import-paths': [
        'error',
        {
          allowSameFolder: false,
          rootDir: 'client/src',
          prefix: '@/client',
        },
      ],
    },
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    extends: [tseslint.configs.disableTypeChecked],
  }
);
