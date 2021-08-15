/* eslint-disable @typescript-eslint/ban-types */

// Utility types

interface Unsubscribable {
  unsubscribe(): void;
}
interface Subscribable<T> {
  // subscribe(observer?: PartialObserver<T>): Unsubscribable;
  subscribe(
    next?: (value: T) => void,
    error?: (error: any) => void,
    complete?: () => void
  ): Unsubscribable;
}
export type SubscribableOrPromise<T> = Subscribable<T> | PromiseLike<T>;

export type FunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

export type PickFunctionProperties<T> = Pick<T, FunctionPropertyNames<T>>;

export type NonFunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

/** If you need class with */
export type PickNonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;

export type AnyValue =
  | undefined
  | null
  | boolean
  | string
  | number
  | Date
  | Record<string, unknown>
  | Record<string, unknown>[];
export type AnyObject<T = object> =
  | {
      [k in keyof T]?: AnyObject<T[k]>;
    }
  | AnyValue;
export type AnyFn = (...args: unknown[]) => unknown;
export type AnyAsyncFn<U = any> = (...args: any[]) => SubscribableOrPromise<U>;

export type AnyAsyncResult<T> = T extends SubscribableOrPromise<infer U> ? U : T;
export type PromiseReturn<T> = T extends () => Promise<infer I> ? I : never;

export type BooleanInput = string | boolean | null | undefined;
