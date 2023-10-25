/* eslint-disable @typescript-eslint/ban-types */
import { InjectionToken } from '@angular/core';
import type { NgxRxdbCollectionConfig } from '@ngx-odm/rxdb/config';
import { NgxRxdbService } from '@ngx-odm/rxdb/core';
import { debug, logFn } from '@ngx-odm/rxdb/utils';
import type {
  MangoQuery,
  RxCollection,
  RxDatabase,
  RxDocument,
  RxDumpCollectionAny,
  RxLocalDocument,
  RxStorageWriteError,
} from 'rxdb/plugins/core';
import { RxReplicationState } from 'rxdb/plugins/replication';
import {
  Observable,
  ReplaySubject,
  defer,
  map,
  merge as merge$,
  startWith,
  switchMap,
} from 'rxjs';
import { collectionMethod } from './rxdb-collection.helpers';

type AnyObject = Record<string, any>;
type SubscribableOrPromise<T> = {
  pipe?: (...args: any[]) => any;
  subscribe?: (
    next?: (value: T) => void,
    error?: (error: any) => void,
    complete?: () => void
  ) => void;
  then?: (
    onfulfilled?: ((value: T) => T | PromiseLike<T>) | undefined | null,
    onrejected?: ((reason: any) => T | PromiseLike<T>) | undefined | null
  ) => Promise<T>;
};

/* eslint-disable jsdoc/require-jsdoc */
/**
 * Service for interacting with a RxDB collection.
 */
export type NgxRxdbCollection<T extends AnyObject> = {
  readonly db: Readonly<RxDatabase>;
  readonly collection: RxCollection<T>;
  initialized$: Observable<unknown>;

  destroy(): void;
  info(): SubscribableOrPromise<any>;
  import(docs: T[]): void;
  sync(
    remoteDbName?: string,
    customHeaders?: { [h: string]: string }
  ): RxReplicationState<T, any>;

  docs(query?: MangoQuery<T>): Observable<T[]>;
  docsByIds(ids: string[]): Observable<T[]>;
  count(): Observable<number>;

  get(id: string): Observable<RxDocument<T> | null>;
  insert(data: T): SubscribableOrPromise<RxDocument<T>>;
  insertBulk(
    data: T[]
  ): SubscribableOrPromise<{ success: RxDocument<T>[]; error: RxStorageWriteError<T>[] }>;
  upsert(data: Partial<T>): SubscribableOrPromise<RxDocument<T>>;
  updateBulk(
    query: MangoQuery<T>,
    data: Partial<T>
  ): SubscribableOrPromise<RxDocument<T, {}>[]>;
  set(id: string, data: Partial<T>): SubscribableOrPromise<RxDocument<T> | null>;
  remove(id: string): SubscribableOrPromise<RxDocument<T> | null>;
  removeBulk(query: MangoQuery<T>): SubscribableOrPromise<RxDocument<T>[]>;

  getLocal<I extends string, K extends string>(
    id: I,
    key?: K
  ): SubscribableOrPromise<K extends never ? RxLocalDocument<AnyObject> : unknown>;
  insertLocal(id: string, data: unknown): SubscribableOrPromise<RxLocalDocument<AnyObject>>;
  upsertLocal(id: string, data: unknown): SubscribableOrPromise<RxLocalDocument<any>>;
  setLocal(id: string, prop: string, value: unknown): SubscribableOrPromise<boolean>;
  removeLocal(id: string): SubscribableOrPromise<boolean>;
};
/* eslint-enable jsdoc/require-jsdoc */

/**
 * Injection token for Service for interacting with a RxDB collection.
 * This token is used to inject an instance of NgxRxdbCollection into a component or service.
 */
export const NgxRxdbCollectionService = new InjectionToken<NgxRxdbCollection<AnyObject>>(
  'NgxRxdbCollection'
);

/**
 * Factory function that returns a new instance of NgxRxdbCollection
 * with the provided NgxRxdbService and NgxRxdbCollectionConfig.
 * @param config - The configuration object for the collection to be created automatically.
 */
export function collectionServiceFactory(config: NgxRxdbCollectionConfig) {
  return (dbService: NgxRxdbService): NgxRxdbCollection<AnyObject> =>
    new NgxRxdbCollectionServiceImpl(dbService, config);
}

/**
 * Service for interacting with a RxDB collection.
 */
export class NgxRxdbCollectionServiceImpl<T extends AnyObject>
  implements NgxRxdbCollection<T>
{
  private _collection!: RxCollection<T>;
  private _init$ = new ReplaySubject();

  get initialized$(): Observable<unknown> {
    return this._init$.asObservable();
  }

  get collection(): RxCollection<T> {
    return this._collection as RxCollection<T>;
  }

  get db(): Readonly<RxDatabase> {
    return this.dbService.db as RxDatabase;
  }

  constructor(
    protected readonly dbService: NgxRxdbService,
    protected readonly config: NgxRxdbCollectionConfig
  ) {
    dbService
      .initCollection(this.config)
      .then((collection: RxCollection) => {
        this._collection = collection as RxCollection<T>;
        this._init$.next(true);
        this._init$.complete();
      })
      .catch(e => {
        this._init$.complete();
        throw new Error(e.message ?? e);
      });
  }

  destroy(): void {
    this.collection?.destroy();
  }

  sync(
    remoteDbName = 'db',
    customHeaders?: { [h: string]: string }
  ): RxReplicationState<T, any> {
    throw new Error('Method not implemented.');
  }

  @collectionMethod()
  info(): SubscribableOrPromise<any> {
    return this.collection.count().$;
  }

  /**
   * import array of docs into collection
   * @param docs
   */
  @collectionMethod({ startImmediately: false, asObservable: false })
  import(docs: T[]): void {
    const dump: RxDumpCollectionAny<T> = {
      name: this.collection.name,
      schemaHash: this.collection.schema.hash,
      docs,
    };
    this.collection.importJSON(dump);
  }

  docs(query?: MangoQuery<T>): Observable<T[]> {
    return this.initialized$.pipe(
      switchMap(() => this.collection.find(query).$),
      debug('docs'),
      map(docs => docs.map(d => d.toMutableJSON())),
      debug('docs:mapped')
    );
  }

  docsByIds(ids: string[]): Observable<T[]> {
    return this.initialized$.pipe(
      switchMap(() => this.collection.findByIds(ids).$),
      map(result => [...result.values()].map(d => d.toMutableJSON())),
      debug('docsByIds')
    );
  }

  count(): Observable<number> {
    return this.initialized$.pipe(
      switchMap(() =>
        merge$(this.collection.insert$, this.collection.remove$).pipe(startWith(null))
      ),
      switchMap(() => this.collection.count().exec()),
      debug('count')
    );
  }

  @collectionMethod({ startImmediately: false, asObservable: true })
  get(id: string): Observable<RxDocument<T> | null> {
    return this.collection.findOne(id).$;
  }

  @collectionMethod()
  insert(data: T): SubscribableOrPromise<RxDocument<T>> {
    return this.collection.insert(data);
  }

  @collectionMethod()
  insertBulk(
    data: T[]
  ): SubscribableOrPromise<{ success: RxDocument<T>[]; error: RxStorageWriteError<T>[] }> {
    return this.collection.bulkInsert(data);
  }

  @collectionMethod()
  upsert(data: Partial<T>): SubscribableOrPromise<RxDocument<T>> {
    return this.collection.upsert(data);
  }

  @collectionMethod()
  set(id: string, data: Partial<T>): SubscribableOrPromise<RxDocument<T> | null> {
    return this.collection.findOne(id).update({ $set: data });
  }

  @collectionMethod()
  updateBulk(
    query: MangoQuery<T>,
    data: Partial<T>
  ): SubscribableOrPromise<RxDocument<T, {}>[]> {
    return this.collection.find(query).update({ $set: data });
  }

  @collectionMethod()
  remove(id: string): SubscribableOrPromise<RxDocument<T> | null> {
    return this.collection.findOne(id).remove();
  }

  @collectionMethod()
  removeBulk(query: MangoQuery<T>): SubscribableOrPromise<RxDocument<T>[]> {
    return this.collection.find(query).remove();
  }

  // ---------------------------------------------------------------------------
  // Local Documents @see https://rxdb.info/rx-local-document.html
  // ---------------------------------------------------------------------------

  @collectionMethod({ startImmediately: false, asObservable: true })
  getLocal<I extends string, K extends string>(
    id: I,
    key?: K
  ): SubscribableOrPromise<K extends never ? RxLocalDocument<AnyObject> : unknown> {
    return this.collection.getLocal$(id).pipe(
      map(doc => {
        if (!doc) {
          return null;
        }
        return key ? doc.get(key) : doc;
      })
    );
  }

  @collectionMethod()
  insertLocal(
    id: string,
    data: unknown
  ): SubscribableOrPromise<RxLocalDocument<AnyObject>> {
    return this.collection.insertLocal(id, data);
  }

  @collectionMethod()
  upsertLocal(
    id: string,
    data: unknown
  ): SubscribableOrPromise<RxLocalDocument<AnyObject>> {
    return this.collection.upsertLocal(id, data);
  }

  @collectionMethod()
  setLocal(id: string, prop: string, value: unknown): SubscribableOrPromise<boolean> {
    return defer(async () => {
      const localDoc: RxLocalDocument<unknown> | null = await this.collection.getLocal(id);
      if (!localDoc || localDoc[prop] === value) {
        return false;
      }
      localDoc.set(prop, value);
      return await localDoc.save();
    });
  }

  @collectionMethod()
  removeLocal(id: string): SubscribableOrPromise<any> {
    return defer(async () => {
      const localDoc: RxLocalDocument<unknown> | null = await this.collection.getLocal(id);
      return await localDoc?.remove();
    });
  }
}
