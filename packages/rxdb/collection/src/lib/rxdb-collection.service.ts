import { InjectionToken } from '@angular/core';
import type { NgxRxdbCollectionConfig } from '@ngx-odm/rxdb/config';
import {
  NgxRxdbCollectionDump,
  NgxRxdbCollectionStaticMethods,
  NgxRxdbError,
  NgxRxdbService,
} from '@ngx-odm/rxdb/core';
import { merge } from '@ngx-odm/rxdb/utils';
import type { PouchAllDocsOptions } from 'rxdb/dist/types/types/pouch';
import type {
  MangoQuery,
  RxCollection,
  RxDatabase,
  RxDocument,
  RxDocumentBase,
  RxError,
} from 'rxdb/plugins/core';
import { RxReplicationState } from 'rxdb/plugins/core';
import {
  EMPTY,
  Observable,
  ReplaySubject,
  defer,
  identity,
  map,
  merge as merge$,
  of,
  startWith,
  switchMap,
  tap,
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
type LocalDocument = (RxDocumentBase<AnyObject> & { isLocal(): true }) | null;
type AllDocsOptions = PouchAllDocsOptions; // & PouchDB.Core.AllDocsWithinRangeOptions;
type NgxRxdbBulkResponse = {
  ok: boolean;
  id: string;
  rev: string;
}[];
type RxCollectionWithStatics<T extends AnyObject> = RxCollection<
  T,
  // eslint-disable-next-line @typescript-eslint/ban-types
  {},
  NgxRxdbCollectionStaticMethods
>;

/* eslint-disable jsdoc/require-jsdoc */
/**
 * Service for interacting with a RxDB collection.
 */
export type NgxRxdbCollection<T extends AnyObject> = {
  readonly db: Readonly<RxDatabase>;
  readonly collection: RxCollectionWithStatics<T>;
  initialized$: Observable<unknown>;

  destroy(): void;
  info(): SubscribableOrPromise<any>;
  getIndexes(): SubscribableOrPromise<any>;
  import(docs: T[]): void;
  sync(remoteDbName?: string, customHeaders?: { [h: string]: string }): RxReplicationState;

  docs(query?: MangoQuery<T>): Observable<RxDocument<T>[]>;
  docsByIds(ids: string[]): Observable<RxDocument<T>[]>;
  allDocs(options?: AllDocsOptions): Observable<T[]>;
  count(): Observable<number>;

  get(id: string): Observable<RxDocument<T> | null>;
  insert(data: T): SubscribableOrPromise<RxDocument<T | null>>;
  insertBulk(data: T[]): SubscribableOrPromise<{ success: RxDocument<T>[]; error: any }>;
  upsert(data: Partial<T>): SubscribableOrPromise<RxDocument<T>>;
  updateBulk(query: MangoQuery<T>, data: Partial<T>): SubscribableOrPromise<T[]>;
  set(id: string, data: Partial<T>): SubscribableOrPromise<RxDocument<T> | null>;
  remove(id: string): SubscribableOrPromise<any>;
  removeBulk(query: MangoQuery<T>): SubscribableOrPromise<any>;

  getLocal(id: string, key?: string): SubscribableOrPromise<LocalDocument>;
  insertLocal(id: string, data: any): SubscribableOrPromise<LocalDocument>;
  upsertLocal(id: string, data: any): SubscribableOrPromise<LocalDocument>;
  setLocal(id: string, prop: string, value: any): SubscribableOrPromise<any>;
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
  private _collection!: RxCollectionWithStatics<T>;
  private _init$ = new ReplaySubject();

  get initialized$(): Observable<unknown> {
    return this._init$.asObservable();
  }

  get collection(): RxCollectionWithStatics<T> {
    return this._collection as RxCollectionWithStatics<T>;
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
        this._collection = collection as RxCollectionWithStatics<T>;
        this._init$.next(true);
        this._init$.complete();
      })
      .catch(e => {
        this._init$.complete();
        throw new NgxRxdbError(e.message ?? e);
      });
  }

  destroy(): void {
    this.collection?.destroy();
  }

  sync(remoteDbName = 'db', customHeaders?: { [h: string]: string }): RxReplicationState {
    return this.dbService.syncCollection(this.collection, remoteDbName, customHeaders);
  }

  @collectionMethod()
  info(): SubscribableOrPromise<any> {
    return this.collection.info();
  }

  @collectionMethod()
  getIndexes(): SubscribableOrPromise<any> {
    return this.collection.getIndexes();
  }

  /**
   * import array of docs into collection
   * @param docs
   */
  @collectionMethod({ startImmediately: false, asObservable: false })
  import(docs: T[]): void {
    const dump = new NgxRxdbCollectionDump<T>({
      name: this.collection.name,
      schemaHash: this.collection.schema.hash,
      docs,
    });
    this.collection.importDump(dump as any);
  }

  docs(query?: MangoQuery<T>): Observable<RxDocument<T>[]> {
    return this.initialized$.pipe(switchMap(() => this.collection.find(query).$));
  }

  docsByIds(ids: string[]): Observable<RxDocument<T>[]> {
    return this.initialized$.pipe(
      switchMap(() => this.collection.findByIds$(ids)),
      map(result => [...result.values()])
    );
  }

  @collectionMethod({ startImmediately: false, asObservable: true })
  allDocs(options: AllDocsOptions = {}): Observable<T[]> {
    const defaultOptions = {
      include_docs: true,
      attachments: false,
      startkey: '_design\uffff', // INFO: to skip design docs
    };
    options = merge(defaultOptions, options);
    return defer(async () => {
      const result = await this.collection.pouch.allDocs(options).catch(e => {
        return { rows: [] };
      });
      return result.rows.map(({ doc, id }) => ({ ...doc, id }));
    });
  }

  count(): Observable<number> {
    return this.initialized$.pipe(
      switchMap(() =>
        merge$(this.collection.insert$, this.collection.remove$).pipe(startWith(null))
      ),
      switchMap(() => this.collection.countAllDocuments())
    );
  }

  @collectionMethod({ startImmediately: false, asObservable: true })
  get(id: string): Observable<RxDocument<T> | null> {
    return this.collection.findOne(id).$;
  }

  @collectionMethod()
  insert(data: T): SubscribableOrPromise<RxDocument<T | null>> {
    return this.collection.insert(data) as any;
  }

  @collectionMethod()
  insertBulk(data: T[]): SubscribableOrPromise<{ success: RxDocument<T>[]; error: any }> {
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
  updateBulk(query: MangoQuery<T>, data: Partial<T>): SubscribableOrPromise<T[]> {
    return this.collection.find(query).update({ $set: data });
  }

  @collectionMethod()
  remove(id: string): SubscribableOrPromise<any> {
    return this.collection.findOne(id).remove();
  }

  @collectionMethod()
  removeBulk(query: MangoQuery<T>): SubscribableOrPromise<any> {
    return this.collection.find(query).remove();
  }

  /**
   * @param query
   * @param values
   * @deprecated
   * updates all docs by given query
   * also represents a way to use 'pouch.bulkDocs' with RxDb
   */
  _updateBulkByPouch(
    query: MangoQuery<T>,
    values: Partial<T>
  ): Observable<NgxRxdbBulkResponse> {
    return defer(async () => {
      try {
        const docs = await this.collection.find(query).exec();
        if (!docs?.length) {
          return of([]) as Observable<NgxRxdbBulkResponse>;
        }
        const docsToUpdate = docs.map(doc => ({
          _id: doc.primary,
          _rev: doc['_rev'],
          ...doc.toJSON(),
          ...values,
        }));
        return this.collection.pouch.bulkDocs(docsToUpdate);
      } catch (error) {
        return EMPTY as any;
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Local Documents @see https://rxdb.info/rx-local-document.html
  // ---------------------------------------------------------------------------

  @collectionMethod({ startImmediately: false, asObservable: true })
  getLocal(id: string, key?: string): SubscribableOrPromise<LocalDocument | any | null> {
    return this.collection
      .getLocal$(id)
      .pipe(key ? map((doc: LocalDocument) => doc?.get(key)) : identity);
  }

  @collectionMethod()
  insertLocal(id: string, data: any): SubscribableOrPromise<LocalDocument> {
    return this.collection.insertLocal(id, data);
  }

  @collectionMethod()
  upsertLocal(id: string, data: any): SubscribableOrPromise<LocalDocument> {
    return this.collection.upsertLocal(id, data);
  }

  @collectionMethod()
  setLocal(id: string, prop: string, value: any): SubscribableOrPromise<boolean> {
    return defer(async () => {
      const localDoc: LocalDocument = await this.collection.getLocal(id);
      if (!localDoc || localDoc[prop] === value) {
        return false;
      }
      // change data
      localDoc.set(prop, value);
      return await localDoc.save();
    });
  }

  @collectionMethod()
  removeLocal(id: string): SubscribableOrPromise<boolean> {
    return defer(async () => {
      const localDoc: LocalDocument = await this.collection.getLocal(id);
      // change data
      return await localDoc!.remove();
    });
  }
}
