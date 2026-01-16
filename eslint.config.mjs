import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import nx from '@nx/eslint-plugin';
import eslintPluginJsdoc from 'eslint-plugin-jsdoc';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import eslintPluginImport from 'eslint-plugin-import';


const compat = new FlatCompat({
  baseDirectory: '.', // __dirname,
  recommendedConfig: js.configs.recommended,
});

const prettierConfig = compat.extends('plugin:prettier/recommended').map(config => ({
  ...config,
  files: [
    '**/*.ts',
    '**/*.tsx',
    '**/*.js',
    '**/*.jsx',
    '**/*.cjs',
    '**/*.mjs',
    '**/*.cts',
    '**/*.mts',
  ],
}));

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  ...prettierConfig,
  {
    ignores: ['**/dist', '**/build'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    plugins: {
      jsdoc: eslintPluginJsdoc,
      prettier: eslintPluginPrettier,
      import: eslintPluginImport,
    },
    settings: {
      jsdoc: {
        ignoreInternal: true,
        checkDefaults: false,
      },
    },
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [],
        },
      ],
      //
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
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    rules: {},
  },
];
