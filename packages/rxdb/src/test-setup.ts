// import '../../../jest.base.setup';
// @ts-expect-error https://thymikee.github.io/jest-preset-angular/docs/getting-started/test-environment
globalThis.ngJest = {
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
