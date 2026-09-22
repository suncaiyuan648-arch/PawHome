import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const uniGlobals = {
  App: 'readonly',
  Behavior: 'readonly',
  Component: 'readonly',
  Page: 'readonly',
  getApp: 'readonly',
  getCurrentPages: 'readonly',
  plus: 'readonly',
  uni: 'readonly',
  wx: 'readonly',
}

const typescriptRecommended = tseslint.configs.recommended.map((config) => ({
  ...config,
  files: config.files ?? ['**/*.{ts,tsx,mts,cts}'],
}))

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/unpackage/**',
      '**/dist/**',
      '**/coverage/**',
      '**/.artifacts/**',
      '**/uni_modules/**',
    ],
  },

  js.configs.recommended,

  ...typescriptRecommended,

  ...pluginVue.configs['flat/recommended'],

  {
    files: ['**/*.{js,cjs,mjs,ts,tsx,vue}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...uniGlobals,
      },
    },
  },

  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },

  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  eslintConfigPrettier,
]
