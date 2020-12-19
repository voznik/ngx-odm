export function isEmpty(object, deep = false) {
  if (object == null || !!!object) {
    return true;
  } else {
    if (Object.keys(object).length) {
      return deep ? Object.values(object).every(val => val === null || !!!val) : false;
    }
    return true;
  }
}

export function noop(): void {
  return void 0;
}

export function logFn(...args) {
  if ((window as any).process?.env?.DEBUG) {
    // tslint:disable-next-line: no-console
    console.log.call(
      console,
      `%c[DEBUG:: NgxRxdb::]`,
      'background: #8d2089; color: #fff; padding: 2px; font-size: normal;',
      ...args
    );
  }
}

export class NgxRxdbError extends Error {
  constructor(message: string, public extra?: any) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, NgxRxdbError.prototype);
  }
}
