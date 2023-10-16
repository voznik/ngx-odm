const nxPreset = require('@nx/jest/preset').default;

const CI = process.env.CI === 'true' || true;

/** @type {import('jest').Config} */
const config = {
  ...nxPreset,
  collectCoverage: CI,
  coverageReporters: [
    'html',
    'text-summary',
    'json',
    ['lcov', { file: 'rxdb-coverage.lcov' }],
    ['json-summary', { file: 'rxdb-coverage-summary.json' }],
  ],
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/*.{stories,worker}.ts',
    '!**/index.ts',
    '!**/node_modules/**',
  ],
  bail: true,
  verbose: true,
  // resetModules: true,
  // clearMocks: true,
  passWithNoTests: true,
};

module.exports = config;
