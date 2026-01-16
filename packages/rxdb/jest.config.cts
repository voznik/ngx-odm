const ignoredModules = [
  'query-string',
  'decode-uri-component',
  'split-on-first',
  'filter-obj',
];

module.exports = {
  displayName: 'tst',
  preset: '../../jest.preset.js',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  transformIgnorePatterns: [
    // Ignore Angular and other compiled modules
    `node_modules/(?!.*\\.mjs$|${ignoredModules.join('|')})`,
  ],
  moduleNameMapper: {
    // Ensure tests use source files instead of dist
    '^@ngx-odm/rxdb/collection$': '<rootDir>/collection/src/index.ts',
    '^@ngx-odm/rxdb/collection/(.*)$': '<rootDir>/collection/src/$1',
    '^@ngx-odm/rxdb/config$': '<rootDir>/config/src/index.ts',
    '^@ngx-odm/rxdb/config/(.*)$': '<rootDir>/config/src/$1',
    '^@ngx-odm/rxdb/core$': '<rootDir>/core/src/index.ts',
    '^@ngx-odm/rxdb/core/(.*)$': '<rootDir>/core/src/$1',
    '^@ngx-odm/rxdb/prepare$': '<rootDir>/prepare/src/index.ts',
    '^@ngx-odm/rxdb/prepare/(.*)$': '<rootDir>/prepare/src/$1',
    '^@ngx-odm/rxdb/query-params$': '<rootDir>/query-params/src/index.ts',
    '^@ngx-odm/rxdb/query-params/(.*)$': '<rootDir>/query-params/src/$1',
    '^@ngx-odm/rxdb/replication-kinto$': '<rootDir>/replication-kinto/src/index.ts',
    '^@ngx-odm/rxdb/replication-kinto/(.*)$': '<rootDir>/replication-kinto/src/$1',
    '^@ngx-odm/rxdb/signals$': '<rootDir>/signals/src/index.ts',
    '^@ngx-odm/rxdb/signals/(.*)$': '<rootDir>/signals/src/$1',
    '^@ngx-odm/rxdb/testing$': '<rootDir>/testing/src/index.ts',
    '^@ngx-odm/rxdb/testing/(.*)$': '<rootDir>/testing/src/$1',
    '^@ngx-odm/rxdb/utils$': '<rootDir>/utils/src/index.ts',
    '^@ngx-odm/rxdb/utils/(.*)$': '<rootDir>/utils/src/$1',
    '^@ngx-odm/rxdb$': '<rootDir>/src/index.ts',
    '^@ngx-odm/rxdb/(.*)$': '<rootDir>/src/$1',
  },
  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes',
    'jest-preset-angular/build/serializers/ng-snapshot',
    'jest-preset-angular/build/serializers/html-comment',
  ],
  coverageDirectory: `../../coverage/packages`,
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/**/index.ts',
    '!**/node_modules/**',
    '!utils/**/*.{ts,tsx}',
    '!testing/**/*.{ts,tsx}',
    '!jest.config.ts',
  ],
};
