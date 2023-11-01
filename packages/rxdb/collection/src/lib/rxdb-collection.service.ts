/* eslint-disable @typescript-eslint/ban-types */
import { InjectionToken } from '@angular/core';
import type { RxCollectionCreatorExtended } from '@ngx-odm/rxdb/config';
import { NgxRxdbService } from '@ngx-odm/rxdb/core';
import { debug } from '@ngx-odm/rxdb/utils';
import type {
  MangoQuery,
  RxCollection,
  RxDatabase,
  RxDocument,
  RxDumpCollection,
  RxDumpCollectionAny,
  RxLocalDocument,
  RxStorageWriteError,
} from 'rxdb';
import {
  Observable,
  ReplaySubject,
  lastValueFrom,
  map,
  merge as merge$,
  startWith,
  switchMap,
} from 'rxjs';

/**
 * Service for interacting with a RxDB collection.
 */
export type NgxRxdbCollection<T = {}> = {
  readonly db: Readonly<RxDatabase>;
  readonly collection: RxCollection<T>;
  initialized$: Observable<unknown>;

  destroy(): void;
  info(): Promise<{}>;
  import(docs: T[]): void;
  export(): Promise<RxDumpCollection<T>>;

  docs(query?: MangoQuery<T>): Observable<T[]>;
  docsByIds(ids: string[]): Observable<T[]>;
  count(): Observable<number>;

  get(id: string): Observable<T | null>;
  insert(data: T): Promise<RxDocument<T>>;
  insertBulk(
    data: T[]
  ): Promise<{ success: RxDocument<T>[]; error: RxStorageWriteError<T>[] }>;
  upsert(data: Partial<T>): Promise<RxDocument<T>>;
  updateBulk(query: MangoQuery<T>, data: Partial<T>): Promise<RxDocument<T, {}>[]>;
  set(id: string, data: Partial<T>): Promise<RxDocument<T> | null>;
  remove(id: string): Promise<RxDocument<T> | null>;
  removeBulk(query: MangoQuery<T>): Promise<RxDocument<T>[]>;

  getLocal<I extends string, K extends string>(
    id: I,
    key?: K
  ): Observable<K extends never ? RxLocalDocument<unknown> : unknown>;
  insertLocal(id: string, data: unknown): Promise<RxLocalDocument<unknown>>;
  upsertLocal(id: string, data: unknown): Promise<RxLocalDocument<unknown>>;
  setLocal(
    id: string,
    prop: string,
    value: unknown
  ): Promise<RxLocalDocument<unknown> | null>;
  removeLocal(id: string): Promise<unknown>;
};

/**
 * Injection token for Service for interacting with a RxDB collection.
 * This token is used to inject an instance of NgxRxdbCollection into a component or service.
 */
export const NgxRxdbCollectionService = new InjectionToken<NgxRxdbCollection>(
  'NgxRxdbCollection'
);

/**
 * Factory function that returns a new instance of NgxRxdbCollection
 * with the provided NgxRxdbService and NgxRxdbCollectionConfig.
 * @param config - The configuration object for the collection to be created automatically.
 */
export function collectionServiceFactory(config: RxCollectionCreatorExtended) {
  return (dbService: NgxRxdbService): NgxRxdbCollection =>
    new NgxRxdbCollectionServiceImpl(dbService, config);
}

/**
 * Service for interacting with a RxDB collection.
 */
export class NgxRxdbCollectionServiceImpl<T extends {}> implements NgxRxdbCollection<T> {
  private _collection!: RxCollection<T>;
  private _init$ = new ReplaySubject<boolean>();

  get initialized$(): Observable<boolean> {
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
    protected readonly config: RxCollectionCreatorExtended
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

  async info(): Promise<{}> {
    await this.ensureCollection();
    const meta = (await this.collection.storageInstance.internals) || {};
    return meta;
  }

  /**
   * import array of docs into collection
   * @param docs
   */
  async import(docs: T[]): Promise<void> {
    await this.ensureCollection();
    const dump: RxDumpCollectionAny<T> = {
      name: this.collection.name,
      schemaHash: this.collection.schema.hash,
      docs,
    };
    this.collection.importJSON(dump);
  }

  async export(): Promise<RxDumpCollection<T>> {
    await this.ensureCollection();
    return this.collection.exportJSON();
  }

  docs(query?: MangoQuery<T>): Observable<T[]> {
    return this.initialized$.pipe(
      switchMap(() => this.collection.find(query).$),
      map((docs = []) => docs.map(d => d.toMutableJSON())),
      debug('docs')
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

  get(id: string): Observable<T | null> {
    return this.initialized$.pipe(
      switchMap(() => this.collection.findOne(id).$),
      map(doc => (doc ? doc.toMutableJSON() : null)),
      debug('get one')
    );
  }

  async insert(data: T): Promise<RxDocument<T>> {
    await this.ensureCollection();
    return this.collection.insert(data);
  }

  async insertBulk(
    data: T[]
  ): Promise<{ success: RxDocument<T>[]; error: RxStorageWriteError<T>[] }> {
    await this.ensureCollection();
    return this.collection.bulkInsert(data);
  }

  async upsert(data: Partial<T>): Promise<RxDocument<T>> {
    await this.ensureCollection();
    return this.collection.upsert(data);
  }

  async set(id: string, data: Partial<T>): Promise<RxDocument<T> | null> {
    await this.ensureCollection();
    return this.collection.findOne(id).update({ $set: data });
  }

  async updateBulk(query: MangoQuery<T>, data: Partial<T>): Promise<RxDocument<T, {}>[]> {
    await this.ensureCollection();
    return this.collection.find(query).update({ $set: data });
  }

  async remove(id: string): Promise<RxDocument<T> | null> {
    await this.ensureCollection();
    return this.collection.findOne(id).remove();
  }

  async removeBulk(query: MangoQuery<T>): Promise<RxDocument<T>[]> {
    await this.ensureCollection();
    return this.collection.find(query).remove();
  }

  // ---------------------------------------------------------------------------
  // Local Documents @see https://rxdb.info/rx-local-document.html
  // ---------------------------------------------------------------------------

  getLocal<I extends string, K extends string>(
    id: I,
    key?: K
  ): Observable<K extends never ? RxLocalDocument<{}> : unknown> {
    return this.initialized$.pipe(
      switchMap(() => this.collection.getLocal$(id)),
      map(doc => {
        if (!doc) {
          return null;
        }
        return key ? doc.get(key) : doc;
      }),
      debug('get local')
    );
  }

  async insertLocal(id: string, data: unknown): Promise<RxLocalDocument<{}>> {
    await this.ensureCollection();
    return this.collection.insertLocal(id, data);
  }

  async upsertLocal(id: string, data: unknown): Promise<RxLocalDocument<{}>> {
    await this.ensureCollection();
    return this.collection.upsertLocal(id, data);
  }

  async setLocal(
    id: string,
    prop: string,
    value: unknown
  ): Promise<RxLocalDocument<unknown> | null> {
    await this.ensureCollection();
    const localDoc: RxLocalDocument<unknown> | null = await this.collection.getLocal(id);
    if (!localDoc || localDoc[prop] === value) {
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return localDoc.update({ [prop]: value }) as Promise<any>;
  }

  async removeLocal(id: string): Promise<unknown> {
    await this.ensureCollection();
    const localDoc: RxLocalDocument<unknown> | null = await this.collection.getLocal(id);
    return await localDoc?.remove();
  }

  async ensureCollection(): Promise<boolean> {
    if (!this.collection) {
      await lastValueFrom(this.initialized$);
    }
    return !!this.collection;
  }
}
