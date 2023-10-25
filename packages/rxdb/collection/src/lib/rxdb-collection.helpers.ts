/* eslint-disable @typescript-eslint/no-explicit-any */
import { debug } from '@ngx-odm/rxdb/utils';
import { Subject, first, switchMap, tap, identity } from 'rxjs';

/**
 * Collection method decorator
 *
 * Ensure the collection is created before the method is called by piping riginal method
 * through class init$ observable property which emits when collection is created
 * Additionally, if `startImmediately` is true, evaluate resulting method observable
 *
 * @internal
 */
export function collectionMethod(
  { startImmediately, asObservable } = { startImmediately: true, asObservable: true }
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      const result$ = new Subject<any>();
      const deffered$ = (this as any).initialized$.pipe(
        switchMap(() => originalMethod.apply(this, args)),
        startImmediately ? first() : identity,
        tap(result$),
        debug(originalMethod.name)
      );
      if (startImmediately) {
        deffered$.subscribe();
        return result$;
      } else {
        return deffered$;
      }
    };
    return descriptor;
  };
}
