/* eslint-disable no-var, @typescript-eslint/ban-types */
/* SystemJS module definition */
declare var nodeModule: NodeModule;
declare var process: NodeJS.Process;

// support NodeJS modules without type definitions
// declare module "*";

interface NodeModule {
    id: string;
}
type NodeListenerCallback<T> = (param1: T) => void;
interface Window {
    process: any;
    require: any;
    // IntersectionObserver: IntersectionObserver;
}

declare const ngDevMode: boolean;
// @ts-ignore
declare var global: any;
declare var require: NodeRequire;

type Cast<I, O> = Exclude<I, O> extends never ? I : O;
type Mutable<T> = { -readonly [P in keyof T]: T[P] };
type Primitive = undefined | null | boolean | string | number | Date | Symbol;
type Enum<E> = Record<keyof E, number | string> & {
    [k: number]: string;
};
/**
 * Falsy
 *
 * @description Type representing falsy values in TypeScript: `false | "" | 0 | null | undefined`
 * @example
 *   type Various = 'a' | 'b' | undefined | false;
 *
 *   // Expect: "a" | "b"
 *   Exclude<Various, Falsy>;
 */
type Falsy = false | '' | 0 | null | undefined;
type Nil = null | undefined;
type MaybeUndefined<T> = undefined extends T ? undefined : never;
type StringifiedKey<T> = Cast<keyof T, string>;
interface Unsubscribable {
    unsubscribe(): void;
}
interface Subscribable<T> {
    subscribe(next?: (value: T) => void, error?: (error: any) => void, complete?: () => void): Unsubscribable;
}
type SubscribableOrPromise<T> = Subscribable<T> & PromiseLike<T>;
type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends Array<infer I> ? Array<DeepPartial<I>> : DeepPartial<T[P]>;
};
type PathImpl<T, K extends keyof T> = K extends string
    ? T[K] extends Date
        ? K
        : T[K] extends Record<string, any>
        ? T[K] extends ArrayLike<any>
            ? K | `${K}.${PathImpl<T[K], Exclude<keyof T[K], keyof any[]>>}`
            : K | `${K}.${PathImpl<T[K], keyof T[K]>}`
        : K
    : never;
type Path<T> = PathImpl<T, keyof T> | keyof T;
type PathValue<T, P extends Path<T>> = P extends `${infer K}.${infer Rest}`
    ? K extends keyof T
        ? Rest extends Path<T[K]>
            ? PathValue<T[K], Rest>
            : never
        : never
    : P extends keyof T
    ? T[P]
    : never;

type FunctionPropertyNames<T> = {
    [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];
type PickFunctionProperties<T> = Pick<T, FunctionPropertyNames<T>>;
type PropertyNames<T> = {
    [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

type PickProperties<T> = Pick<T, PropertyNames<T>>;

type AnyValue = undefined | null | boolean | string | number | Date | any;
type AnyObject<T = any> = {
    [k in keyof T]?: AnyObject<T[k]> | AnyValue;
};
type AnyFn = (...args: unknown[]) => unknown;
type AnyAsyncFn<U = any> = (...args: any[]) => SubscribableOrPromise<U>;

type TypedMessageEvent<T> = Partial<MessageEvent> & {
    data: T;
};
type ValueIteratee<T, O> = (value: T) => O;

type ExcludePrefix<T, U extends string> = T extends `${U}${infer _K}` ? never : T;
type OmitPrefix<T, K extends string> = Pick<T, ExcludePrefix<keyof T, K>>;
