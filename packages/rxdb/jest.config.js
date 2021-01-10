// eslint-disable-next-line no-undef
module.exports = {
  name: '@ngx-odm/rxdb',
  preset: '../../jest.config.js',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(pouchdb-adapter-asyncstorage)/)',
    //
  ],
  moduleNameMapper: {
    // 'my-module.js': '<rootDir>/path/to/my-module.js',
  },
  globals: {
    'ts-jest': {
      tsConfig: '<rootDir>/tsconfig.spec.json',
      stringifyContentPathRegex: '\\.(html|svg)$',
      astTransformers: [
        'jest-preset-angular/build/InlineFilesTransformer',
        'jest-preset-angular/build/StripStylesTransformer',
      ],
    },
  },
  coverageReporters: [
    'text-summary',
    'json',
    ['lcov', { file: 'rxdb-coverage.lcov' }],
    ['json-summary', { file: 'rxdb-coverage-summary.json' }],
  ],
  coverageDirectory: '../../coverage/packages',
  snapshotSerializers: [
    'jest-preset-angular/build/AngularNoNgAttributesSnapshotSerializer.js',
    'jest-preset-angular/build/AngularSnapshotSerializer.js',
    'jest-preset-angular/build/HTMLCommentSerializer.js',
  ],
};
