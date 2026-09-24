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
  PawEvent: 'readonly',
  UniNamespace: 'readonly',
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
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },

  {
    // These files are the first behavior-preserving JS-to-TS migration slice.
    // Their runtime contracts are covered by governance tests; strict domain
    // typing will be added incrementally without weakening the rest of the repo.
    files: ['packages/**/services/**/*.ts', 'services/domainReads/**/*.ts'],
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'off',
      'no-useless-assignment': 'off',
      'no-useless-catch': 'off',
    },
  },

  {
    // These local management/account readers have completed the strict typing
    // pass and must not inherit the migration-only TypeScript suppressions.
    files: [
      'packages/account/services/actorSession.ts',
      'packages/account/services/localProfileStorage.ts',
      'packages/account/services/taskPageModel.ts',
      'packages/account/services/tasksRuntime.ts',
      'packages/account/services/domainTaskReaders.ts',
      'packages/account/services/managementAdapter.ts',
      'packages/account/services/managementEditorRuntime.ts',
      'packages/account/services/managementMutationAdapter.ts',
      'packages/account/services/taskAdapter.ts',
      'packages/adoption/services/progress.ts',
      'packages/adoption/services/actorCapabilities.ts',
      'packages/adoption/services/adoptionConditionContract.ts',
      'packages/adoption/services/applicationAdapter.ts',
      'packages/adoption/services/messageStore.ts',
      'packages/adoption/services/reviewActionAdapter.ts',
      'packages/adoption/services/reviewAdapter.ts',
      'packages/yard/services/localManagementStorage.ts',
      'packages/yard/services/managementEditorGate.ts',
      'packages/animal/services/localManagementStorage.ts',
      'packages/animal/services/animalManagementEditorGate.ts',
      'packages/message/services/messageStore.ts',
      'packages/rescue/services/lists.ts',
      'packages/rescue/services/messageStore.ts',
      'packages/rescue/services/mineReader.ts',
      'packages/rescue/services/progress.ts',
      'packages/rescue/services/proof.ts',
      'packages/rescue/services/reviewActionAdapter.ts',
      'packages/rescue/services/reviewAdapter.ts',
      'packages/rescue/services/stateAdapter.ts',
      'packages/rescue/services/stateContract.ts',
      'packages/feeding/services/feedbackAdapter.ts',
      'packages/feeding/services/feedbackEvidenceStorage.ts',
      'packages/feeding/services/orderAdapter.ts',
      'packages/feeding/services/orderMockApi.ts',
      'packages/feeding/services/orderRuntime.ts',
      'packages/feeding/services/orderVisibilityStorage.ts',
      'packages/feeding/services/taskReader.ts',
      'packages/dynamic/services/orderAssociation.ts',
      'packages/dynamic/services/orderPicker.ts',
      'packages/dynamic/services/reader.ts',
      'packages/dynamic/services/feedbackPublisher.ts',
      'services/domainReads/adoption/applicationAdapter.ts',
      'services/domainReads/adoption/reviewAdapter.ts',
      'services/domainReads/rescue/lists.ts',
      'services/domainReads/rescue/stateAdapter.ts',
      'services/domainReads/rescue/stateContract.ts',
    ],
    rules: {
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      'no-unused-vars': 'off',
      'no-useless-assignment': 'error',
      'no-useless-catch': 'error',
    },
  },

  eslintConfigPrettier,
]
