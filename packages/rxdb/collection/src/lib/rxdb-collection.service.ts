/* eslint-disable @typescript-eslint/ban-types */
import { InjectionToken } from '@angular/core';
import type { NgxRxdbCollectionConfig } from '@ngx-odm/rxdb/config';
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
export type NgxRxdbCollection<T extends {}> = {
  readonly db: Readonly<RxDatabase>;
  readonly collection: RxCollection<T>;
  initialized$: Observable<unknown>;

  destroy(): void;
  info(): Promise<{}>;
  import(docs: T[]): void;
  export(docs: T[]): Promise<RxDumpCollection<T>>;

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
  ): Observable<K extends never ? RxLocalDocument<{}> : unknown>;
  insertLocal(id: string, data: unknown): Promise<RxLocalDocument<{}>>;
  upsertLocal(id: string, data: unknown): Promise<RxLocalDocument<{}>>;
  setLocal(id: string, prop: string, value: unknown): Promise<boolean>;
  removeLocal(id: string): Promise<boolean>;
};

/**
 * Injection token for Service for interacting with a RxDB collection.
 * This token is used to inject an instance of NgxRxdbCollection into a component or service.
 */
export const NgxRxdbCollectionService = new InjectionToken<NgxRxdbCollection<{}>>(
  'NgxRxdbCollection'
);

/**
 * Factory function that returns a new instance of NgxRxdbCollection
 * with the provided NgxRxdbService and NgxRxdbCollectionConfig.
 * @param config - The configuration object for the collection to be created automatically.
 */
export function collectionServiceFactory(config: NgxRxdbCollectionConfig) {
  return (dbService: NgxRxdbService): NgxRxdbCollection<{}> =>
    new NgxRxdbCollectionServiceImpl(dbService, config);
}

/**
 * Service for interacting with a RxDB collection.
 */
export class NgxRxdbCollectionServiceImpl<T extends {}> implements NgxRxdbCollection<T> {
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

  async info(): Promise<{}> {
    await lastValueFrom(this.initialized$);
    const meta = (await this.collection.storageInstance.internals) || {};
    return meta;
  }

  /**
   * import array of docs into collection
   * @param docs
   */
  async import(docs: T[]): Promise<void> {
    await lastValueFrom(this.initialized$);
    const dump: RxDumpCollectionAny<T> = {
      name: this.collection.name,
      schemaHash: this.collection.schema.hash,
      docs,
    };
    this.collection.importJSON(dump);
  }

  async export(): Promise<RxDumpCollection<T>> {
    await lastValueFrom(this.initialized$);
    return this.collection.exportJSON();
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

  get(id: string): Observable<T | null> {
    return this.initialized$.pipe(
      switchMap(() => this.collection.findOne(id).$),
      map(doc => (doc ? doc.toMutableJSON() : null)),
      debug('get one')
    );
  }

  async insert(data: T): Promise<RxDocument<T>> {
    await lastValueFrom(this.initialized$);
    return this.collection.insert(data);
  }

  async insertBulk(
    data: T[]
  ): Promise<{ success: RxDocument<T>[]; error: RxStorageWriteError<T>[] }> {
    await lastValueFrom(this.initialized$);
    return this.collection.bulkInsert(data);
  }

  async upsert(data: Partial<T>): Promise<RxDocument<T>> {
    await lastValueFrom(this.initialized$);
    return this.collection.upsert(data);
  }

  async set(id: string, data: Partial<T>): Promise<RxDocument<T> | null> {
    await lastValueFrom(this.initialized$);
    return this.collection.findOne(id).update({ $set: data });
  }

  async updateBulk(query: MangoQuery<T>, data: Partial<T>): Promise<RxDocument<T, {}>[]> {
    await lastValueFrom(this.initialized$);
    return this.collection.find(query).update({ $set: data });
  }

  async remove(id: string): Promise<RxDocument<T> | null> {
    await lastValueFrom(this.initialized$);
    return this.collection.findOne(id).remove();
  }

  async removeBulk(query: MangoQuery<T>): Promise<RxDocument<T>[]> {
    await lastValueFrom(this.initialized$);
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
    await lastValueFrom(this.initialized$);
    return this.collection.insertLocal(id, data);
  }

  async upsertLocal(id: string, data: unknown): Promise<RxLocalDocument<{}>> {
    await lastValueFrom(this.initialized$);
    return this.collection.upsertLocal(id, data);
  }

  async setLocal(id: string, prop: string, value: unknown): Promise<boolean> {
    await lastValueFrom(this.initialized$);
    const localDoc: RxLocalDocument<unknown> | null = await this.collection.getLocal(id);
    if (!localDoc || localDoc[prop] === value) {
      return false;
    }
    localDoc.set(prop, value);
    return await localDoc.save();
  }

  async removeLocal(id: string): Promise<any> {
    await lastValueFrom(this.initialized$);
    const localDoc: RxLocalDocument<unknown> | null = await this.collection.getLocal(id);
    return await localDoc?.remove();
  }
}
