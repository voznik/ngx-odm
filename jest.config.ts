/* eslint-disable import/no-default-export */
import { getJestProjects } from '@nx/jest';

const CI = process.env['CI'] || true;

export default {
  projects: getJestProjects(),
  coverageReporters: [
    'text-summary',
    'json',
    ['lcov', { file: 'rxdb-coverage.lcov' }],
    ['json-summary', { file: 'rxdb-coverage-summary.json' }],
  ],
  // coverageReporters: ['json-summary', 'json', 'lcovonly', 'lcov', 'text-summary', 'html'],
  coverageDirectory: '../../coverage/packages',
  /**
   * By default, Jest runs all tests and produces all errors into the console upon completion.
   * The bail config option can be used here to have Jest stop running tests after n failures.
   * Setting bail to true is the same as setting bail to 1
   */
  bail: true,
  /**
   * Indicates whether each individual test should be reported during the run.
   * All errors will also still be shown on the bottom after execution.
   */
  verbose: true,
  /**
   * The directory where Jest should store its cached dependency information.
   */
  // cacheDirectory: '<rootDir>/.cache',

  /**
   * By default, each test file gets its own independent module registry.
   * Enabling resetModules goes a step further and resets the module registry before running
   * each individual test. This is useful to isolate modules for every test so that local
   * module state doesn't conflict between tests. This can be done programmatically
   * using jest.resetModules().
   */
  resetModules: true,

  /**
   * Automatically clear mock calls and instances between every test.
   * Equivalent to calling jest.clearAllMocks() between each test.
   * This does not remove any mock implementation that may have been provided.
   */
  clearMocks: true,
  /**
   * Indicates whether the coverage information should be collected while executing the test.
   * Because this retrofits all executed files with coverage collection statements,
   * it may significantly slow down your tests.
   */
  collectCoverage: CI,
  passWithNoTests: true,
};
