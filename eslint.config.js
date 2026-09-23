import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // .claude/worktrees — рабочие копии репозитория; без этого линт (и vitest)
  // прогоняют по несколько копий одного и того же кода.
  globalIgnores(['dist', '.claude', 'scripts/restore-output']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Компоненты в JSX плагином react не отслеживаются (его тут нет),
      // поэтому имена с большой буквы не считаем неиспользуемыми.
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    // Serverless-функции Vercel и служебные скрипты выполняются в Node,
    // а не в браузере: без этого process и Buffer — no-undef.
    files: ['api/**/*.js', 'scripts/**/*.mjs'],
    languageOptions: {
      globals: globals.node,
      sourceType: 'module',
    },
  },
])
