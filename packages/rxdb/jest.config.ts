/* eslint-disable import/no-default-export */
import { workspaceRoot } from '@nrwl/tao/src/utils/app-root';
import type { Config } from 'jest';

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
  coverageDirectory: `${workspaceRoot}/coverage/packages`,
};

export default config;
