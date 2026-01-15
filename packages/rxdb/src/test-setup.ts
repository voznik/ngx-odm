(globalThis as any).structuredClone = (val: any) => JSON.parse(JSON.stringify(val));

import 'setimmediate';
import { webcrypto } from 'node:crypto';

Object.defineProperty(global, 'crypto', {
  value: webcrypto,
});

import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv({
  errorOnUnknownElements: true,
  errorOnUnknownProperties: true,
});


if (process.env['CI']) {
  const consoleMethods: string[] = [
    'error',
    'trace',
    'debug',
    'warn',
    'log',
    'group',
    'groupCollapsed',
  ];

  consoleMethods.forEach((methodName: string) => {
    jest.spyOn(global.console, methodName as any).mockImplementation((...args: any[]) => {
      if (methodName === 'error' && !args[0].includes('RxError')) {
        console.error(...args);
      }
      jest.fn();
    });
  });
}
