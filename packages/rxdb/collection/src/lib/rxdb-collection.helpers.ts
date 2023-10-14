import { Subject, first, shareReplay, switchMap, tap, identity } from 'rxjs';

/**
 * Collection method decorator
 *
 * Ensure the collection is created before the method is called by piping riginal method
 * through class init$ observable property which emits when collection is created
 * Additionally, if `startImmediately` is true, evaluate resulting method observable
 */
export function collectionMethod({ startImmediately } = { startImmediately: true }) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      const result$ = new Subject<any>();
      const deffered$ = (this as any).initialized$.pipe(
        switchMap(() => originalMethod.apply(this, args)),
        startImmediately ? first() : identity,
        tap(result$)
        // shareReplay({ bufferSize: 1, refCount: true })
      );
      if (startImmediately) {
        // console.info(`ensureCollection:${originalMethod.name} result$ has 0 observers, subscribe`);
        deffered$.subscribe();
        return result$;
      } else {
        return deffered$;
      }
    };
    return descriptor;
  };
}
