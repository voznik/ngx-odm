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
  return (window as any).process?.env?.DEBUG;
}

export function isTestMode(): boolean {
  return (window as any).process?.env?.TEST;
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
