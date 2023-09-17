/* eslint-disable no-var, @typescript-eslint/ban-types */
/* SystemJS module definition */
declare var nodeModule: NodeModule;
declare var process: NodeJS.Process;

// support NodeJS modules without type definitions
// declare module "*";

/**
 * @internal
 */
interface NodeModule {
    id: string;
}
/**
 * @internal
 */
type NodeListenerCallback<T> = (param1: T) => void;
/**
 * @internal
 */
interface Window {
    process: any;
    require: any;
    // IntersectionObserver: IntersectionObserver;
}

/**
 * @internal
 */
declare const ngDevMode: boolean;
/**
 * @internal
 */
// @ts-ignore
declare var global: any;
/**
 * @internal
 */
declare var require: NodeRequire;

/** @internal */
type Cast<I, O> = Exclude<I, O> extends never ? I : O;
/**
 * @internal
 */
type Mutable<T> = { -readonly [P in keyof T]: T[P] };
/**
 * @internal
 */
type Primitive = undefined | null | boolean | string | number | Date | Symbol;
/**
 * @internal
 */
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
/** @internal */
type Nil = null | undefined;
/** @internal */
type MaybeUndefined<T> = undefined extends T ? undefined : never;
/** @internal */
type StringifiedKey<T> = Cast<keyof T, string>;
/**
 * @internal
 */
interface Unsubscribable {
    unsubscribe(): void;
}
/**
 * @internal
 */
interface Subscribable<T> {
    subscribe(next?: (value: T) => void, error?: (error: any) => void, complete?: () => void): Unsubscribable;
}
type SubscribableOrPromise<T> = Subscribable<T> | PromiseLike<T>;
/**
 * @internal
 */
type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends Array<infer I> ? Array<DeepPartial<I>> : DeepPartial<T[P]>;
};
/**
 * @internal
 */
type PathImpl<T, K extends keyof T> = K extends string
    ? T[K] extends Date
        ? K
        : T[K] extends Record<string, any>
        ? T[K] extends ArrayLike<any>
            ? K | `${K}.${PathImpl<T[K], Exclude<keyof T[K], keyof any[]>>}`
            : K | `${K}.${PathImpl<T[K], keyof T[K]>}`
        : K
    : never;
/**
 * @internal
 */
type Path<T> = PathImpl<T, keyof T> | keyof T;
/**
 * @internal
 */
type PathValue<T, P extends Path<T>> = P extends `${infer K}.${infer Rest}`
    ? K extends keyof T
        ? Rest extends Path<T[K]>
            ? PathValue<T[K], Rest>
            : never
        : never
    : P extends keyof T
    ? T[P]
    : never;

/**
 * @internal
 */
type FunctionPropertyNames<T> = {
    [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];
/**
 * @internal
 */
type PickFunctionProperties<T> = Pick<T, FunctionPropertyNames<T>>;
/**
 * @internal
 */
type PropertyNames<T> = {
    [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

/**
 * @internal
 */
type PickProperties<T> = Pick<T, PropertyNames<T>>;

type AnyValue = undefined | null | boolean | string | number | Date | any;
/**
 * @internal
 */
type AnyObject<T = any> = {
    [k in keyof T]?: AnyObject<T[k]> | AnyValue;
};
/**
 * @internal
 */
type AnyFn = (...args: unknown[]) => unknown;
/**
 * @internal
 */
type AnyAsyncFn<U = any> = (...args: any[]) => SubscribableOrPromise<U>;

/**
 * @internal
 */
type TypedMessageEvent<T> = Partial<MessageEvent> & {
    data: T;
};
/**
 * @internal
 */
type ValueIteratee<T, O> = (value: T) => O;
/**
 * @internal
 * Service mock type
 */
type ServiceMock<T> = T & { [P in keyof T]: T[P] & jest.SpyInstance };

/**
 * @internal
 * General entity model
 */
type Entity = {
    /**
     * The Id of the entity
     */
    id: EntityId<any>;
};
/**
 * @internal
 *  Type that represents a related entity id
 */
type EntityId<T extends Entity> = string;
/**
 * @internal
 * Model that holds a map of data, referenced by their id
 */
type EntityMap<T extends Entity> = Record<string, T>;
/**
 * @internal
 * Model that holds a map of data, referenced by their id
 */
type EntitiesMap<T extends Entity> = Record<string, Array<T>>;

type ExcludePrefix<T, U extends string> = T extends `${U}${infer _K}` ? never : T;
type OmitPrefix<T, K extends string> = Pick<T, ExcludePrefix<keyof T, K>>;
