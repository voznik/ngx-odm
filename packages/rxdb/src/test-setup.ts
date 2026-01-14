(globalThis as any).ngJest = {
  testEnvironmentOptions: {
    errorOnUnknownElements: true,
    errorOnUnknownProperties: true,
  },
};
(globalThis as any).structuredClone = (val: any) => JSON.parse(JSON.stringify(val));

import 'setimmediate';
import 'jest-preset-angular/setup-jest';

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
