import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

// Headless layers (DESIGN.md §14.2): no Phaser, Preact, render or ui imports; no DOM globals.
const HEADLESS = ['src/{core,data,mods,calc,gen,sim,run}/**/*.{ts,tsx}'];
// Non-deterministic time/random sources are banned in the headless layers (scripts may time runs).
const DETERMINISTIC = HEADLESS;

export default defineConfig(
  globalIgnores(['dist', 'coverage']),
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: HEADLESS,
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['phaser', 'phaser/*'], message: 'Headless layers must not import Phaser.' },
            {
              group: ['preact', 'preact/*', '@preact/*'],
              message: 'Headless layers must not import Preact.',
            },
            {
              group: ['**/render', '**/render/**'],
              message: 'Headless layers must not import render.',
            },
            { group: ['**/ui', '**/ui/**'], message: 'Headless layers must not import ui.' },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        'window',
        'document',
        'localStorage',
        'sessionStorage',
        'navigator',
        'requestAnimationFrame',
      ],
    },
  },
  {
    files: DETERMINISTIC,
    rules: {
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use the seeded RNG in src/core/rng.ts.' },
        {
          object: 'Date',
          property: 'now',
          message: 'Wall-clock time is banned in deterministic code.',
        },
        {
          object: 'performance',
          property: 'now',
          message: 'Wall-clock time is banned in deterministic code.',
        },
      ],
    },
  },
  {
    files: ['src/render/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['**/ui', '**/ui/**'], message: 'render must not import ui.' },
            {
              group: ['preact', 'preact/*', '@preact/*'],
              message: 'render must not import Preact.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['**/render', '**/render/**'], message: 'ui talks to Phaser only via run.' },
            { group: ['phaser', 'phaser/*'], message: 'ui must not import Phaser.' },
          ],
        },
      ],
    },
  },
);
