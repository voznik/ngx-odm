/* eslint-disable @typescript-eslint/ban-types */

// -----------------------------------------------------------------------------
// Utility types
// -----------------------------------------------------------------------------

interface Unsubscribable {
  unsubscribe(): void;
}
interface Subscribable<T> {
  subscribe(observer?: PartialObserver<T>): Unsubscribable;
  subscribe(
    next?: (value: T) => void,
    error?: (error: any) => void,
    complete?: () => void
  ): Unsubscribable;
}
type SubscribableOrPromise<T> = Subscribable<T> | PromiseLike<T>;

type FunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

type PickFunctionProperties<T> = Pick<T, FunctionPropertyNames<T>>;

type NonFunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

/** If you need class with */
type PickNonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;

type AnyValue =
  | undefined
  | null
  | boolean
  | string
  | number
  | Date
  | Record<string, unknown>
  | Record<string, unknown>[];
type AnyObject<T = object> =
  | {
      [k in keyof T]?: AnyObject<T[k]>;
    }
  | AnyValue;
type AnyFn = (...args: unknown[]) => unknown;
type AnyAsyncFn<U = any> = (...args: any[]) => SubscribableOrPromise<U>;

type Awaited<T> = T extends PromiseLike<infer U>
  ? Awaited<U>
  : T extends Subscribable<infer U>
  ? Awaited<U>
  : T;
