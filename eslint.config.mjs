import nx from '@nx/eslint-plugin';
import eslintPluginJsdoc from 'eslint-plugin-jsdoc';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import eslintPluginImport from 'eslint-plugin-import';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/build'],
  },
  // Apply jsdoc only to JS/TS files
  {
    ...eslintPluginJsdoc.configs['flat/recommended'],
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.mjs', '**/*.cjs'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    plugins: {
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
    files: ['**/*.html'],
    rules: {},
  },
  // { files: ['**/*.json'], rules: {}, }, // JSON better be formatted with `nx format` command - it captures even non-statged files
  // Prettier must be last to override other configs
  eslintPluginPrettierRecommended,
];
