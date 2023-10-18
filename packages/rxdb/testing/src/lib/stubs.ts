/// <reference types="jest" />

/** See https://github.com/angular/angular/issues/25837 */
export function setupNavigationWarnStub() {
  const warn = console.warn;
  const error = console.error;
  jest.spyOn(console, 'warn').mockImplementation((...args: any[]) => {
    const [firstArg] = args;
    if (
      typeof firstArg === 'string' &&
      firstArg.startsWith('Navigation triggered outside Angular zone')
    ) {
      return;
    }
    return warn.apply(console, args);
  });
  jest.spyOn(console, 'error').mockImplementation((...args: any[]) => {
    const [firstArg] = args;
    if (typeof firstArg === 'string' && firstArg.startsWith('Attempted to log "[DEBUG')) {
      return;
    }
    return error.apply(console, args);
  });
}
