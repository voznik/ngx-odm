// import 'document-register-element';
import 'jest-preset-angular'; // commented out due to issue in latest jest-preset-angular

// require('dotenv').config();
Error.stackTraceLimit = 3;
const CI = process.env['CI'] === 'true';

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
/**
 * ISSUE: https://github.com/angular/material2/issues/7101
 * Workaround for JS DOM missing transform property
 */
Object.defineProperty(document.body.style, 'transform', {
  value: () => {
    return {
      enumerable: true,
      configurable: true,
    };
  },
});

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