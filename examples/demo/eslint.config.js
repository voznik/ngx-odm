const { FlatCompat } = require('@eslint/eslintrc');
const baseConfig = require('../../eslint.config.js');
const js = require('@eslint/js');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

module.exports = [
  ...baseConfig,
  ...compat
    .config({
      extends: [
        'plugin:@nx/angular',
        'plugin:@angular-eslint/template/process-inline-templates',
      ],
    })
    .map(config => ({
      ...config,
      files: ['**/*.ts'],
      rules: {
        '@angular-eslint/directive-selector': [
          'error',
          {
            type: 'attribute',
            style: 'camelCase',
          },
        ],
        '@angular-eslint/component-selector': [
          'error',
          {
            type: 'element',
            style: 'kebab-case',
          },
        ],
        'import/no-unresolved': 0,
        '@angular-eslint/prefer-standalone': 'off',
      },
    })),
  ...compat.config({ extends: ['plugin:@nx/angular-template'] }).map(config => ({
    ...config,
    files: ['**/*.html'],
    rules: {},
  })),
];
