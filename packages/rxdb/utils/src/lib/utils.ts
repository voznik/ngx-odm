/* eslint-disable @typescript-eslint/no-namespace, @typescript-eslint/no-unused-vars, @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any */
import { NgZone, isDevMode } from '@angular/core';
import type { FilledMangoQuery, PreparedQuery, RxDocument, RxJsonSchema } from 'rxdb';
import { prepareQuery } from 'rxdb';
import { RxReplicationState } from 'rxdb/plugins/replication';
import { Observable, OperatorFunction, map, retry, tap, timer } from 'rxjs';

/** @internal */
export type AnyObject = Record<string, any>;
/** @internal */
export type Cast<I, O> = Exclude<I, O> extends never ? I : O;
/** @internal */
type Nil = null | undefined;
/** @internal */
type Falsy = false | '' | 0 | null | undefined;
/** @internal */
type MaybeUndefined<T> = undefined extends T ? undefined : never;
/** @internal */
export type EmptyObject = Record<string, never>;
/** @internal */
export type StringifiedKey<T> = Cast<keyof T, string>;
/** @internal */
export type ValueIteratee<T, O> = (value: T) => O;
/** @internal */
export type ArrayIteratee<I, O> = (item: I, index: number) => O;
/** @internal */
export type ObjectIteratee<T, O> = (item: T[keyof T], key: StringifiedKey<T>) => O;
/** @internal */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {}; // NOSONAR
/** @internal */
export type IsRecord<T> = T extends object
  ? T extends unknown[]
    ? false
    : T extends Set<unknown>
    ? false
    : T extends Map<unknown, unknown>
    ? false
    : T extends Function
    ? false
    : true
  : false;
/** @internal */
export type IsUnknownRecord<T> = string extends keyof T
  ? true
  : number extends keyof T
  ? true
  : false;
/** @internal */
export type IsKnownRecord<T> = IsRecord<T> extends true
  ? IsUnknownRecord<T> extends true
    ? false
    : true
  : false;

export namespace NgxRxdbUtils {
  /**
   * Creates a shallow clone of `value`.
   * @param value
   */
  export function clone<T>(value: T): T {
    if (Array.isArray(value)) {
      return value.slice() as any;
    } else if (isObject(value)) {
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
   * @param object
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
   * Checks if `value` is an empty object or collection.
   *
   * Objects are considered empty if they have no own enumerable string keyed properties.
   *
   * Arrays are considered empty if they have a `length` of `0`.
   * @param value
   */
  export function isEmpty(value: any): boolean {
    if (!Array.isArray(value)) {
      value = keysOfNonArray(value);
    }
    return value.length === 0;
  }

  export const isFunction = (value: any): value is Function => typeof value === 'function';

  export const isUndefined = (value: any): value is undefined =>
    value === undefined || value === 'undefined';

  export function isNullOrUndefined(value: any): value is Nil {
    /* prettier-ignore */
    return value === undefined || value === null || value === 'undefined' || value === 'null';
  }

  export const isObject = (x: any): x is object =>
    Object.prototype.toString.call(x) === '[object Object]';

  export function isNgZone(zone: unknown): zone is NgZone {
    return zone instanceof NgZone;
  }

  export function noop(): void {
    return void 0;
  }

  export function identity<T>(value: T): T {
    return value;
  }

  export function getMaybeId(entityOrId: object | string): string {
    if (isObject(entityOrId)) {
      return entityOrId['_id'];
    }
    return String(entityOrId);
  }

  export function compact<T>(array: Array<T>): Array<Exclude<T, Falsy>> {
    return array.filter(identity) as Array<Exclude<T, Falsy>>;
  }

  /**
   * Creates an object with all empty values removed. The values [], `null`, `""`, `undefined`, and `NaN` are empty.
   * @param obj Object
   */
  export function compactObject<T extends object>(obj: T): Partial<T> {
    if (isEmpty(obj)) {
      return obj;
    }
    if (Array.isArray(obj)) {
      return compact(obj as any) as any;
    }
    return Object.entries(obj)
      .filter(
        ([, value]: [string, any]) => !isNullOrUndefined(identity(value)) && !isEmpty(value)
      )
      .reduce((acc: Partial<T>, [key, val]: [string, any]) => ({ ...acc, [key]: val }), {});
  }

  /**
   * Transforms an object into an URL query string, stripping out any undefined
   * values.
   * @param  {object} obj
   * @param prefix
   * @returns {string}
   * @internal
   */
  export function qsify(obj: any, prefix = ''): string {
    const encode = (v: any): string =>
      encodeURIComponent(typeof v === 'boolean' ? String(v) : v);
    const result: string[] = [];
    forEach(obj, (value, k) => {
      if (isUndefined(value)) return;

      let ks = encode(prefix + k) + '=';
      if (Array.isArray(value)) {
        const values: string[] = [];
        forEach(value, v => {
          if (isUndefined(v)) return;

          values.push(encode(v));
        });
        ks += values.join(',');
      } else {
        ks += encode(value);
      }
      result.push(ks);
    });
    return result.length ? result.join('&') : '';
  }

  export function isDevModeForced(): boolean {
    return localStorage['debug']?.includes(`@ngx-odm/rxdb`);
  }

  /** https://github.com/angular/components/blob/main/src/cdk/platform/features/test-environment.ts */
  export function isTestEnvironment(): boolean {
    return (
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      (typeof __karma__ !== 'undefined' && !!__karma__) ||
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      (typeof jasmine !== 'undefined' && !!jasmine) ||
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      (typeof jest !== 'undefined' && !!jest) ||
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      (typeof Mocha !== 'undefined' && !!Mocha)
    );
  }

  /**
   * Internal logger for debugging
   */
  export const logger = {
    log: (function () {
      const bgColor = '#8d2089';
      if (isTestEnvironment() || !isDevMode() || !isDevModeForced()) {
        return noop;
      }
      // eslint-disable-next-line no-console
      return console.log.bind(
        console,
        `%c[${new Date().toISOString()}::DEBUG::@ngx-odm/rxdb]`,
        `background:${bgColor};color:#fff;padding:2px;font-size:normal;`
      );
    })(),
    table: (function () {
      if (isTestEnvironment() || !isDevMode() || !isDevModeForced()) {
        return noop;
      }
      // eslint-disable-next-line no-console
      return console.table.bind(console);
    })(),
  };

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
      return source.pipe(
        tap({
          next(value: T) {
            logger.log(`observable:${tag}:next:`, value);
          },
          error(e: any) {
            logger.log(`observable:${tag}:error:`, e.message);
          },
          complete() {
            logger.log(`observable:${tag}:complete`);
          },
        })
      );
    };
  }

  /**
   * Moves observable execution in and out of Angular zone.
   * @param zone
   */
  export function runInZone<T>(zone: NgZone): OperatorFunction<T, T> {
    return source => {
      return new Observable(subscriber => {
        return source.subscribe(
          (value: T) => zone.run(() => subscriber.next(value)),
          (e: any) => zone.run(() => subscriber.error(e)),
          () => zone.run(() => subscriber.complete())
        );
      });
    };
  }

  /**
   * Simple rxjs exponential backoff retry operator
   * @param count
   * @param retryTime
   */
  export function retryWithBackoff<T>(count = 3, retryTime = 10000) {
    return (obs$: Observable<T>) =>
      obs$.pipe(
        retry({
          count,
          delay: (_, retryIndex) => {
            const d = Math.pow(2, retryIndex - 1) * retryTime;
            NgxRxdbUtils.logger.log('replication:kinto:longpoll:retry', retryIndex, d);
            return timer(d);
          },
        })
      );
  }

  export const getDefaultQuery: () => FilledMangoQuery<any> = () => ({
    selector: { _deleted: { $eq: false } },
    skip: 0,
    sort: [{ id: 'asc' }],
  });

  const _schema = {
    properties: {
      id: { type: 'string' },
      _deleted: { type: 'boolean' },
    },
    primaryKey: 'id',
    indexes: [['_deleted', 'id']],
  } as unknown as RxJsonSchema<any>;
  const _queryPlan: PreparedQuery<any> = {
    query: getDefaultQuery(),
    queryPlan: {
      index: ['_deleted', 'id'],
      startKeys: [false, -9007199254740991] as any,
      endKeys: [false, '￿'] as any,
      inclusiveEnd: true,
      inclusiveStart: true,
      sortSatisfiedByIndex: true,
      selectorSatisfiedByIndex: false,
    },
  };

  export const getDefaultPreparedQuery: () => PreparedQuery<any> = () =>
    prepareQuery(_schema, getDefaultQuery());
}

/**
 * @see https://stackoverflow.com/a/47180009/3443137
 */
export const getDefaultFetch = () => {
  if (typeof window === 'object' && 'fetch' in window) {
    return window.fetch.bind(window);
  } else {
    return fetch;
  }
};

/**
 * Returns a fetch handler that contains (basic auth) headers
 * @param headers
 */
export function getDefaultFetchWithHeaders(headers: Record<string, string> = {}) {
  const fetch = getDefaultFetch();
  const ret = (url: string, options: Record<string, any>) => {
    Object.assign(options, {
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
        ...headers,
      },
    });
    return fetch(url, options);
  };
  return ret;
}

/**
 * Typescript validator function to check if object is not null and instanceof RxReplicationState
 * @param obj
 */
export function isValidRxReplicationState<T>(
  obj: any
): obj is RxReplicationState<T, unknown> {
  return obj && obj instanceof RxReplicationState;
}

export function mapFindResultToJsonArray(
  withRevAndAttachments = false // INFO: rxdb typings somehow are wrong (tru|false)
): OperatorFunction<any[] | Map<string, any>, any[]> {
  return map<RxDocument[] | Map<string, RxDocument>, any[]>(docs => {
    return (Array.isArray(docs) ? docs : [...docs.values()]).map(d => {
      const data: any = { ...d._data };
      if (!withRevAndAttachments) {
        delete data._rev;
        delete data._attachments;
        delete data._deleted;
        delete data._meta;
      }
      return data;
    });
  });
}
