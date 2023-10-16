import { InjectionToken } from '@angular/core';
import type { NgxRxdbCollectionConfig } from '@ngx-odm/rxdb/config';
import { NgxRxdbCollectionDump, NgxRxdbError, NgxRxdbService } from '@ngx-odm/rxdb/core';
import type { PouchAllDocsOptions } from 'rxdb/dist/types/types/pouch';
import type {
  MangoQuery,
  RxCollection,
  RxDatabase,
  RxDocument,
  RxDocumentBase,
} from 'rxdb/plugins/core';
import { RxReplicationState } from 'rxdb/plugins/core';
import { EMPTY, Observable, ReplaySubject, defer, of, shareReplay } from 'rxjs';
import { collectionMethod } from './rxdb-collection.helpers';

type AnyObject = Record<string, any>;
type SubscribableOrPromise<T> = {
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
type LocalDocument = (RxDocumentBase<any> & { isLocal(): true }) | null;
type AllDocsOptions = PouchAllDocsOptions; // & PouchDB.Core.AllDocsWithinRangeOptions;
type NgxRxdbBulkResponse = {
  ok: boolean;
  id: string;
  rev: string;
}[];

/**
 * Service for interacting with a RxDB collection.
 */
export type NgxRxdbCollection<T extends AnyObject> = {
  readonly db: Readonly<RxDatabase>;
  readonly collection: Readonly<RxCollection<T>>;
  destroy(): void;
  initialized$: Observable<boolean>;
  info(): SubscribableOrPromise<any>;
  import(docs: T[]): void;
  sync(remoteDbName?: string, customHeaders?: { [h: string]: string }): RxReplicationState;
  docs(query: MangoQuery<T>): Observable<RxDocument<T>[]>;
  docsByIds(ids: string[]): Observable<RxDocument<T>[]>;
  allDocs(options: AllDocsOptions): Observable<T[]>;
  insertBulk(data: T[]): SubscribableOrPromise<{ success: RxDocument<T>[]; error: any }>;
  updateBulk(query: MangoQuery<T>, data: Partial<T>): SubscribableOrPromise<T[]>;
  removeBulk(query: MangoQuery<T>): SubscribableOrPromise<any>;
  get(id: string): Observable<RxDocument<T> | null>;
  insert(data: T): SubscribableOrPromise<RxDocument<T | null>>;
  upsert(data: Partial<T>): SubscribableOrPromise<RxDocument<T>>;
  set(id: string, data: Partial<T>): SubscribableOrPromise<RxDocument<T> | null>;
  remove(id: string): SubscribableOrPromise<any>;
  getLocal(id: string): SubscribableOrPromise<LocalDocument>;
  insertLocal(id: string, data: any): SubscribableOrPromise<LocalDocument>;
  upsertLocal(id: string, data: any): SubscribableOrPromise<LocalDocument>;
  setLocal(id: string, prop: string, value: any): SubscribableOrPromise<any>;
  removeLocal(id: string): SubscribableOrPromise<boolean>;
};

/**
 * Injection token for Service for interacting with a RxDB collection.
 * This token is used to inject an instance of NgxRxdbCollection into a component or service.
 */
export const NgxRxdbCollectionService = new InjectionToken<NgxRxdbCollection<any>>(
  'NgxRxdbCollection'
);

/**
 * Factory function that returns a new instance of NgxRxdbCollection
 * with the provided NgxRxdbService and NgxRxdbCollectionConfig.
 * @param config - The configuration object for the collection.
 * @returns A new instance of NgxRxdbCollectionService.
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
  private _init$ = new ReplaySubject<any>();

  get initialized$(): Observable<boolean> {
    return this._init$.asObservable();
  }

  get collection(): Readonly<RxCollection<T>> {
    return this._collection;
  }

  get db(): Readonly<RxDatabase> {
    return this.dbService.db as RxDatabase;
  }

  constructor(
    protected readonly dbService: NgxRxdbService,
    protected readonly config: NgxRxdbCollectionConfig
  ) {
    dbService
      .initCollection(this.config)!
      .then((collection: RxCollection) => {
        this._collection = collection;
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

  /**
   * import array of docs into collection
   * @param docs
   */
  @collectionMethod()
  import(docs: T[]): void {
    const dump = new NgxRxdbCollectionDump<T>({
      name: this.collection.name,
      schemaHash: this.collection.schema.hash,
      docs,
    });
    this.collection.importDump(dump as any);
  }

  @collectionMethod({ startImmediately: false, asObservable: true })
  docs(query: MangoQuery<T>): Observable<RxDocument<T>[]> {
    return this.collection.find(query).$.pipe();
    // tap(result => { debug('docs', result); })
  }

  @collectionMethod({ startImmediately: false, asObservable: true })
  docsByIds(ids: string[]): Observable<RxDocument<T>[]> {
    return defer(async () => {
      const result = await this.collection.findByIds(ids);
      return [...result.values()];
    });
  }

  @collectionMethod({ startImmediately: false, asObservable: true })
  allDocs(options: AllDocsOptions): Observable<T[]> {
    const defaultOptions = {
      include_docs: true,
      attachments: false,
      startkey: '_design\uffff', // INFO: to skip design docs
    };
    return defer(async () => {
      const result = await this.collection.pouch
        .allDocs({ ...defaultOptions, ...options })
        .catch(e => {
          // debug(e);
          return { rows: [] };
        });
      return result.rows.map(({ doc, id }) => ({ ...doc, id }));
    }).pipe(shareReplay({ bufferSize: 1, refCount: true }));
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

  @collectionMethod()
  getLocal(id: string): SubscribableOrPromise<LocalDocument | null> {
    return this.collection.getLocal(id);
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
      // change data
      localDoc!.set(prop, value);
      return await localDoc!.save();
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
