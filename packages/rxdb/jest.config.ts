/* eslint-disable import/no-default-export */
import type { Config } from 'jest';

const CI = process.env.CI === 'true' || true;

const config: Config = {
  displayName: '@ngx-odm/rxdb',
  preset: '../../jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts', 'jest-localstorage-mock'],
  // A set of global variables that need to be available in all test environments
  globals: {
    __DEV__: true,
    VERSION: 'x.x.x',
  },
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
  collectCoverage: CI,
  coverageDirectory: '../../coverage/packages',
  coverageReporters: [
    'text-summary',
    'json',
    ['lcov', { file: 'rxdb-coverage.lcov' }],
    ['json-summary', { file: 'rxdb-coverage-summary.json' }],
  ],
  bail: true,
  verbose: true,
  // resetModules: true,
  // clearMocks: true,
  passWithNoTests: true,
};

export default config;
