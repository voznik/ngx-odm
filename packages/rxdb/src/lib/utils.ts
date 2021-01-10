import { AnyObject } from './types';

/** @internal */
export function isEmpty(object: AnyObject, deep = false) {
  if (object == null || !object) {
    return true;
  } else {
    if (Object.keys(object).length) {
      return deep ? Object.values(object).every(val => val === null || !val) : false;
    }
    return true;
  }
}

/** @internal */
export function noop(): void {
  return void 0;
}

/** @internal */
export function isDevMode(): boolean {
  return process?.env?.DEBUG || (window as any).process?.env?.DEBUG;
}

export function isTestMode(): boolean {
  return process?.env?.TEST || (window as any).process?.env?.TEST;
}

/** @internal */
export function logFn(title?: string) {
  if (isDevMode()) {
    // eslint-disable-next-line no-console
    return console.log.bind(
      window.console,
      `%c[DEBUG:: ${title ?? 'NgxODM'}::]`,
      'background: #8d2089; color: #fff; padding: 2px; font-size: normal;'
      // ...args
    );
  } else {
    return noop;
  }
}

export class NgxRxdbError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, NgxRxdbError.prototype);
  }
}

// eslint-disable-next-line no-var
declare var jest: any;
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
