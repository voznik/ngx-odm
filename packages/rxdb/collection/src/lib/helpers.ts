/* eslint-disable @typescript-eslint/no-explicit-any */
import type { RxCollectionCreatorExtended } from '@ngx-odm/rxdb/config';
import { NgxRxdbUtils } from '@ngx-odm/rxdb/utils';
import { Observable, defer, lastValueFrom, switchMap } from 'rxjs';

const { debug } = NgxRxdbUtils;

type CollectionLike = {
  readonly initialized$: Observable<boolean>;
  readonly config: RxCollectionCreatorExtended;
};

/**
 * Collection method decorator for Observable return type
 *
 * Ensure the collection is created before the method is called by piping riginal method
 * through class init$ observable property which emits when collection is created
 */
export function ensureCollection$() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function (this: CollectionLike, ...args: any[]) {
      return defer(() => {
        return this.initialized$.pipe(
          switchMap(() => originalMethod.apply(this, args)), // NOSONAR
          debug(`collection.${propertyKey}`)
        );
      });
    };
    return descriptor;
  };
}

/**
 * Collection method decorator for Promise return type
 *
 * Ensure the collection is created before the method is called by piping riginal method
 * through class init$ observable property which emits when collection is created
 */
export function ensureCollection() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (this: CollectionLike, ...args: any[]) {
      await lastValueFrom(this.initialized$).catch(() => {
        // eslint-disable-next-line prettier/prettier
        throw new Error(`Collection "${this.config.name}" was not initialized. Please check RxDB errors.`);
      });

      return originalMethod.apply(this, args);
    };
    return descriptor;
  };
}
