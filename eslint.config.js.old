const { FlatCompat } = require('@eslint/eslintrc');
const nxEslintPlugin = require('@nx/eslint-plugin');
const eslintPluginJsdoc = require('eslint-plugin-jsdoc');
const eslintPluginPrettier = require('eslint-plugin-prettier');
const typescriptEslintEslintPlugin = require('@typescript-eslint/eslint-plugin');
const eslintPluginImport = require('eslint-plugin-import');
const typescriptEslintParser = require('@typescript-eslint/parser');
const globals = require('globals');
const js = require('@eslint/js');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

module.exports = [
  ...compat.extends('plugin:prettier/recommended'),
  {
    plugins: {
      '@nx': nxEslintPlugin,
      jsdoc: eslintPluginJsdoc,
      prettier: eslintPluginPrettier,
      '@typescript-eslint': typescriptEslintEslintPlugin,
      import: eslintPluginImport,
    },
  },
  {
    settings: {
      jsdoc: {
        ignoreInternal: true,
        checkDefaults: false,
      },
    },
    languageOptions: {
      parser: typescriptEslintParser,
      parserOptions: {
        projectService: true,
        sourceType: 'module',
      },
      globals: { ...globals.browser, ...globals.es2020, ...globals.node },
    },
  },
  ...compat
    .config({
      extends: [
        'plugin:import/recommended',
        'plugin:import/typescript',
        'plugin:jsdoc/recommended',
      ],
    })
    .map(config => ({
      ...config,
      files: ['**/*.ts', '**/*.js'],
      rules: {
        'no-prototype-builtins': 0,
        curly: ['error', 'all'],
        'jsdoc/newline-after-description': 0,
        'jsdoc/require-returns-type': 0,
        'jsdoc/require-returns-description': 0,
        'jsdoc/require-jsdoc': [
          0,
          {
            contexts: [
              'TSEnumDeclaration',
              'TSTypeAliasDeclaration',
              'TSInterfaceDeclaration',
              'TSDeclareFunction',
              'ClassDeclaration',
              'TSMethodSignature',
              'MethodDefinition:not([accessibility="private"]) > FunctionExpression',
              'MethodDefinition[key.name!="constructor"]',
              'TSPropertySignature',
              'ArrowFunctionExpression',
              'FunctionDeclaration',
              'ArrowFunctionDeclaration',
              'FunctionExpression',
            ],
            publicOnly: true,
            enableFixer: false,
            fixerMessage: ' INFO: add comment',
            checkSetters: false,
          },
        ],
        'jsdoc/check-param-names': [
          2,
          {
            checkDestructured: false,
            useDefaultObjectProperties: true,
          },
        ],
        'jsdoc/require-param': [
          2,
          {
            checkDestructured: false,
            checkDestructuredRoots: false,
            enableRootFixer: false,
            useDefaultObjectProperties: true,
          },
        ],
        'jsdoc/require-returns': 0,
        'jsdoc/no-defaults': 0,
        'jsdoc/require-param-type': 0,
        'jsdoc/require-param-description': 0,
        'jsdoc/require-example': ['off', { avoidExampleOnConstructors: true }],
        'import/extensions': 'off',
        'import/no-unresolved': 'off',
        'import/named': 'off',
        'import/newline-after-import': 'error',
        'import/no-default-export': 'error',
        'import/no-named-as-default': 'off',
        'import/no-named-as-default-member': 'off',
        'import/no-relative-parent-imports': 'off',
        'import/order': [
          'error',
          {
            alphabetize: {
              order: 'asc',
              caseInsensitive: true,
            },
            'newlines-between': 'never',
            groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          },
        ],
      },
    })),
  ...compat.config({ extends: ['plugin:@nx/typescript'] }).map(config => ({
    ...config,
    files: ['**/*.ts', '**/*.tsx'],
    rules: {},
  })),
  ...compat.config({ extends: ['plugin:@nx/javascript'] }).map(config => ({
    ...config,
    files: ['**/*.js', '**/*.jsx'],
    rules: {},
  })),
  ...compat.config({ env: { jest: true } }).map(config => ({
    ...config,
    files: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.spec.js', '**/*.spec.jsx'],
    rules: {
      'jsdoc/require-jsdoc': 0,
      '@nx/enforce-module-boundaries': 0,
      '@typescript-eslint/no-empty-function': 0,
      '@typescript-eslint/no-non-null-assertion': 0,
      '@typescript-eslint/member-ordering': 0,
      '@angular-eslint/component-selector': 0,
      '@typescript-eslint/no-explicit-any': 0,
    },
  })),
  { ignores: ['!.commitlintrc.json', '**/package.json', 'tools/scripts'] },
];
