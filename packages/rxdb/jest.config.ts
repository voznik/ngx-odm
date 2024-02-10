/* eslint-disable import/no-default-export */
import { workspaceRoot } from '@nrwl/tao/src/utils/app-root';
import type { Config } from 'jest';

const ignoredModules = [
  'query-string',
  'decode-uri-component',
  'split-on-first',
  'filter-obj',
];

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
  transformIgnorePatterns: [
    //
    `node_modules/(?!.*\\.mjs$|${ignoredModules.join('|')})`,
  ],
  collectCoverage: process.env.CI ? true : false,
  coverageDirectory: `${workspaceRoot}/coverage/packages`,
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/**/index.ts',
    '!**/node_modules/**',
    '!utils/**/*.{ts,tsx}',
    '!testing/**/*.{ts,tsx}',
    '!jest.config.ts',
  ],
};

export default config;
