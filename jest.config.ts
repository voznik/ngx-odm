/* eslint-disable import/no-default-export */
import { getJestProjects } from '@nx/jest';
import type { Config } from 'jest';

const config: Config = {
  projects: getJestProjects(),
  globalSetup: 'jest-preset-angular/global-setup',
};

export default config;
