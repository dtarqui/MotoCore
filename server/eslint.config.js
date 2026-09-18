import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

/**
 * Calidad de código del servidor (Arquitectura, sección 12). Corre en
 * *pre-commit* sobre lo que se va a integrar y en el pipeline sobre todo el
 * proyecto.
 */
export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      // El aislamiento depende de qué cliente de datos se usa: un `any` que
      // atraviese la capa de repositorios oculta justo eso (ADR-008).
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
]);
