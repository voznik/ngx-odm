/* eslint-disable @typescript-eslint/ban-types */
import { isDevMode } from '@angular/core';
import { Observable, OperatorFunction, tap } from 'rxjs';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Cast<I, O> = Exclude<I, O> extends never ? I : O;
type Nil = null | undefined;
type EmptyObject = Record<string, never>;
type StringifiedKey<T> = Cast<keyof T, string>;
type ValueIteratee<T, O> = (value: T) => O;
type ArrayIteratee<I, O> = (item: I, index: number) => O;
type ObjectIteratee<T, O> = (item: T[keyof T], key: StringifiedKey<T>) => O;

/**
 * Creates a shallow clone of `value`.
 *
 * Contribution to minified bundle size, when it is the only function imported:
 * - Lodash: 12,696 bytes
 * - Micro-dash: 116 bytes
 * @param value
 */
export function clone<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.slice() as any;
  } else if (value instanceof Object) {
    return { ...value };
  } else {
    return value;
  }
}

/**
 * Creates an array of the own enumerable property names of object.
 *
 * Differences from lodash:
 * - does not give any special consideration for arguments objects, strings, or prototype objects (e.g. many will have `'length'` in the returned array)
 *
 * Contribution to minified bundle size, when it is the only function imported:
 * - Lodash: 3,473 bytes
 * - Micro-dash: 184 bytes
 */

export function keys<T>(object: Nil | T): Array<StringifiedKey<T>> {
  let val = keysOfNonArray(object);
  if (Array.isArray(object)) {
    val = val.filter(item => item !== 'length');
  }
  return val as any;
}

export function keysOfNonArray<T>(object: Nil | T): Array<StringifiedKey<T>> {
  return object ? (Object.getOwnPropertyNames(object) as any) : [];
}

/**
 * Iterates over own enumerable string keyed properties of an object and invokes `iteratee` for each property. Iteratee functions may exit iteration early by explicitly returning `false`.
 *
 * Differences from lodash:
 * - does not treat sparse arrays as dense
 *
 * Contribution to minified bundle size, when it is the only function imported:
 * - Lodash: 3,744 bytes
 * - Micro-dash: 283 bytes
 * @param object
 * @param iteratee
 */
export function forOwn<T>(object: T, iteratee: ObjectIteratee<T, boolean | void>): T {
  forEachOfArray(keys(object), key => iteratee(object[key as keyof T], key));
  return object;
}

export function forOwnOfNonArray<T>(
  object: T,
  iteratee: ObjectIteratee<T, boolean | void>
): T {
  forEachOfArray(keysOfNonArray(object), key => iteratee(object[key as keyof T], key));
  return object;
}

/**
 * Iterates over elements of `collection` and invokes `iteratee` for each element. Iteratee functions may exit iteration early by explicitly returning `false`.
 *
 * Contribution to minified bundle size, when it is the only function imported:
 * - Lodash: 4,036 bytes
 * - Micro-dash: 258 bytes
 * @param array
 * @param iteratee
 */
export function forEach<T extends Nil | readonly any[]>(
  array: T,
  iteratee: ArrayIteratee<NonNullable<T>[number], boolean | void>
): T;
export function forEach<T>(
  object: T,
  iteratee: ObjectIteratee<NonNullable<T>, boolean | void>
): T;

export function forEach(collection: any, iteratee: any): any {
  if (Array.isArray(collection)) {
    forEachOfArray(collection, iteratee);
  } else {
    forOwnOfNonArray(collection, iteratee);
  }
  return collection;
}

export function forEachOfArray<T>(
  array: readonly T[],
  iteratee: ArrayIteratee<T, boolean | void>
): void {
  for (let i = 0, len = array.length; i < len; ++i) {
    if (iteratee(array[i], i) === false) {
      break;
    }
  }
}

/**
 * Recursively merges own enumerable string keyed properties of source objects into the destination object. Object properties are merged recursively. Source objects are applied from left to right. Subsequent sources overwrite property assignments of previous sources.
 *
 * **Note:** This function mutates `object`.
 *
 * Differences from lodash:
 * - will overwrite a value with `undefined`
 * - only supports arguments that are objects
 * - cannot handle circular references
 * - when merging an array onto a non-array, the result is a non-array
 *
 * Contribution to minified bundle size, when it is the only function imported:
 * - Lodash: 10,882 bytes
 * - Micro-dash: 438 bytes
 * @param object
 * @param source
 */
export function merge<A extends object, B extends object>(object: A, source: B): A & B;
export function merge<A extends object, B extends object, C extends object>(
  object: A,
  source1: B,
  source2: C
): A & B & C;
export function merge(object: any, ...sources: any[]): any {
  for (const source of sources) {
    forEach<any>(source, (value, key) => {
      const myValue = object[key];
      if (myValue instanceof Object) {
        value = merge(clone(myValue), value);
      }
      object[key] = value;
    });
  }
  return object;
}

/**
 * Coerces a data-bound value (typically a string) to a boolean.
 * @param value
 */
export function coerceBooleanProperty(value: any): boolean {
  return value != null && `${value}` !== 'false';
}

/**
 * Checks if `value` is an empty object or collection.
 *
 * Objects are considered empty if they have no own enumerable string keyed properties.
 *
 * Arrays are considered empty if they have a `length` of `0`.
 *
 * Contribution to minified bundle size, when it is the only function imported:
 * - Lodash: 4,406 bytes
 * - Micro-dash: 148 bytes
 * @param value
 */
export function isEmpty(value: any): boolean {
  if (!Array.isArray(value)) {
    value = keysOfNonArray(value);
  }
  return value.length === 0;
}

export const isFunction = (value: any): value is Function => typeof value === 'function';

/** @internal */
export function noop(): void {
  return void 0;
}

/** @internal */
export function isTestMode(): boolean {
  try {
    return coerceBooleanProperty(process?.env?.TEST);
  } catch (error) {
    return coerceBooleanProperty((window as any).process?.env?.TEST);
  }
}

/** @internal */
export function logFn(title?: string, bgColor = '#8d2089') {
  if (isDevMode() && localStorage['debug']?.includes('ngx-rxdb')) {
    // eslint-disable-next-line no-console
    return console.log.bind(
      window.console,
      `%c[DEBUG::${title ?? 'NgxODM'}::]`,
      `background:${bgColor};color:#fff;padding:2px;font-size:normal;`
      // ...args
    );
  } else {
    return noop;
  }
}

/**
 * Operator to log debug (in dev mode only)
 * @param tag
 * @see https://gist.github.com/NetanelBasal/46d8266f3fa6d9be15dc1ea6ed6cbe3e#file-oper-16-ts
 */
export function debug<T>(tag = 'Event'): OperatorFunction<T, T> {
  return function debugFn<T>(source: Observable<T>) {
    if (!isDevMode()) {
      return source;
    }
    const log = logFn(`Observable:${tag}:Next`, '#83c4a3');
    const error = logFn(`Observable:${tag}:Error`);
    const complete = logFn(`Observable:${tag}:Complete`, '#919bd4');
    return source.pipe(
      tap({
        next(value: T) {
          log(value);
        },
        error(e: any) {
          error(e.message);
        },
        complete() {
          complete('');
        },
      })
    );
  };
}
