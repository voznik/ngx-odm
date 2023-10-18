(globalThis as any).ngJest = {
  testEnvironmentOptions: {
    errorOnUnknownElements: true,
    errorOnUnknownProperties: true,
  },
};
import 'setimmediate';
import 'jest-preset-angular/setup-jest';

if (process.env['CI']) {
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
