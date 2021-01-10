// import 'document-register-element';
import 'jest-preset-angular'; // commented out due to issue in latest jest-preset-angular

// require('dotenv').config();
Error.stackTraceLimit = 2;
const CI = process.env['CI'] === 'true';
process.env['TEST'] = process.env['CI'] ?? 'true';

/**
 * GLOBAL MOCKS
 */

Object.defineProperty(window, 'CSS', { value: null });
Object.defineProperty(document, 'doctype', {
  value: '<!DOCTYPE html>',
});

Object.defineProperty(window, 'getComputedStyle', {
  value: () => {
    return {
      display: 'none',
      appearance: ['-webkit-appearance'],
    };
  },
});
Object.defineProperty(
  window.navigator,
  'userAgent',
  (value => ({
    get() {
      return value;
    },
    set(v) {
      value = v;
    },
  }))(window.navigator['userAgent'])
);

if (CI) {
  const consoleMethods: string[] = [
    'trace',
    'debug',
    'warn',
    'log',
    'group',
    'groupCollapsed',
  ];

  consoleMethods.forEach((methodName: string) => {
    jest.spyOn(global.console, methodName as any).mockImplementation(() => jest.fn());
  });
}

// https://github.com/angular/angular/issues/20827#issuecomment-394487432
(window as any)['__zone_symbol__supportWaitUnResolvedChainedPromise'] = true;
/* import 'zone.js/dist/zone-testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
); */
