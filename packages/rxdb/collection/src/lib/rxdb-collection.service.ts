/* eslint-disable @typescript-eslint/ban-types */
import { InjectionToken } from '@angular/core';
import type { RxCollectionCreatorExtended } from '@ngx-odm/rxdb/config';
import { NgxRxdbService } from '@ngx-odm/rxdb/core';
import { NgxRxdbUtils } from '@ngx-odm/rxdb/utils';
import type {
  MangoQuery,
  RxCollection,
  RxDatabase,
  RxDatabaseCreator,
  RxDocument,
  RxDumpCollection,
  RxDumpCollectionAny,
  RxLocalDocument,
  RxStorageInfoResult,
  RxStorageWriteError,
} from 'rxdb';
import { RxReplicationState } from 'rxdb/dist/types/plugins/replication';
import {
  Observable,
  ReplaySubject,
  fromEvent,
  lastValueFrom,
  map,
  merge,
  startWith,
  switchMap,
  takeWhile,
} from 'rxjs';

/**
 * Injection token for Service for interacting with a RxDB {@link RxCollection}.
 * This token is used to inject an instance of NgxRxdbCollection into a component or service.
 */
export const NgxRxdbCollectionService = new InjectionToken<NgxRxdbCollection>(
  'NgxRxdbCollection'
);

/**
 * Factory function that returns a new instance of NgxRxdbCollection
 * with the provided NgxRxdbService and RxCollectionCreator.
 * @param config - The configuration object for the collection to be created automatically.
 */
export function collectionServiceFactory(config: RxCollectionCreatorExtended) {
  return (dbService: NgxRxdbService): NgxRxdbCollection =>
    new NgxRxdbCollection(dbService, config);
}

/**
 * Service for interacting with a RxDB {@link RxCollection}.
 */
export class NgxRxdbCollection<T = {}> {
  private _collection!: RxCollection<T>;
  private _replicationState!: RxReplicationState<T, any>;
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

  get dbOptions(): Readonly<RxDatabaseCreator> {
    return this.dbService.dbOptions;
  }

  get replicationState(): RxReplicationState<T, any> {
    return this._replicationState;
  }

  constructor(
    protected readonly dbService: NgxRxdbService,
    protected readonly config: RxCollectionCreatorExtended
  ) {
    this.init(dbService, config);
  }

  /**
   * Destroys the collection's object instance. This is to free up memory and stop all observers and replications.
   */
  destroy(): void {
    this.collection?.destroy();
  }

  async sync(): Promise<void> {
    await this.ensureCollection();
    if (this._replicationState) {
      this.replicationState.reSync();
      return;
    }

    if (typeof this.config.options?.replicationStateFactory !== 'function') {
      return;
    }

    this._replicationState = this.config.options.replicationStateFactory(this.collection);

    if (!this.replicationState.autoStart) {
      this.replicationState.reSync();
    }

    // Re-sync replication when back online
    fromEvent(window, 'online')
      .pipe(takeWhile(() => !this.replicationState.isStopped()))
      .subscribe(() => {
        NgxRxdbUtils.logger.log('online');
        this.replicationState.reSync();
      });

    this.replicationState.error$.subscribe(err => {
      if (
        err.message.includes('unauthorized')
        // || err.message.includes('Failed to fetch')
      ) {
        this.replicationState.cancel();
        NgxRxdbUtils.logger.log('replicationState has error, cancel replication');
        NgxRxdbUtils.logger.log(err.message);
      } else {
        console.error(err);
      }
    });

    return this.replicationState.startPromise;
  }

  /**
   * Returns some info about the db storage. Used in various places. This method is expected to not really care about performance, so do not use it in hot paths.
   */
  async info(): Promise<RxStorageInfoResult> {
    await this.ensureCollection();
    const collectionInfo = (await this.collection.storageInstance.info()) || {
      totalCount: 0,
    };
    NgxRxdbUtils.logger.log({ collectionInfo });
    return collectionInfo;
  }

  /**
   * Imports the json dump into your collection
   * @param docs
   */
  async import(docs: T[]): Promise<void> {
    await this.ensureCollection();
    const schemaHash = await this.collection.schema.hash;
    const dump: RxDumpCollectionAny<T> = {
      name: this.collection.name,
      schemaHash,
      docs,
    };
    this.collection.importJSON(dump);
  }

  /**
   * Creates a json export from every document in the collection.
   */
  async export(): Promise<RxDumpCollection<T>> {
    await this.ensureCollection();
    return this.collection.exportJSON();
  }

  /**
   * Finds documents in your collection
   * Calling this will return an rxjs-Observable which streams every change to data of this collection.
   * @param query
   */
  docs(query?: MangoQuery<T>): Observable<T[]> {
    return this.initialized$.pipe(
      switchMap(() => this.collection.find(query).$),
      map((docs = []) => docs.map(d => d.toMutableJSON())),
      NgxRxdbUtils.debug('docs')
    );
  }

  /**
   * Finds many documents by their id (primary value).
   * This has a way better performance than running multiple findOne() or a find() with a big $or selector.
   *
   * Calling this will return an rxjs-Observable which streams every change to data of this collection.
   * Documents that do not exist or are deleted, will be skipped
   * @param ids
   */
  docsByIds(ids: string[]): Observable<T[]> {
    return this.initialized$.pipe(
      switchMap(() => this.collection.findByIds(ids).$),
      map(result => [...result.values()].map(d => d.toMutableJSON())),
      NgxRxdbUtils.debug('docsByIds')
    );
  }

  /**
   * When you only need the amount of documents that match a query, but you do not need the document data itself, you can use a count query for better performance.
   * The performance difference compared to a normal query differs depending on which RxStorage implementation is used.
   * @param query
   */
  count(query?: MangoQuery<T>): Observable<number> {
    return this.initialized$.pipe(
      switchMap(() =>
        merge(this.collection.insert$, this.collection.remove$).pipe(startWith(null))
      ),
      switchMap(() => this.collection.count(query).exec()),
      NgxRxdbUtils.debug('count')
    );
  }

  /**
   * This does basically what find() does, but it returns only a single document.
   * You can pass a primary value to find a single document more easily.
   * @param id
   */
  get(id: string): Observable<T | null> {
    return this.initialized$.pipe(
      switchMap(() => this.collection.findOne(id).$),
      map(doc => (doc ? doc.toMutableJSON() : null)),
      NgxRxdbUtils.debug('get one')
    );
  }

  /**
   * Inserts new document into the database.
   * The collection will validate the schema and automatically encrypt any encrypted fields
   * @param data
   */
  async insert(data: T): Promise<RxDocument<T>> {
    await this.ensureCollection();
    return this.collection.insert(data);
  }

  /**
   * When you have to insert many documents at once, use bulk insert.
   * This is much faster than calling .insert() multiple times.
   * @param data
   */
  async insertBulk(
    data: T[]
  ): Promise<{ success: RxDocument<T>[]; error: RxStorageWriteError<T>[] }> {
    await this.ensureCollection();
    return this.collection.bulkInsert(data);
  }

  /**
   * Inserts the document if it does not exist within the collection, otherwise it will overwrite it. Returns the new or overwritten RxDocument.
   * @param data
   */
  async upsert(data: Partial<T>): Promise<RxDocument<T>> {
    await this.ensureCollection();
    return this.collection.upsert(data);
  }

  /**
   * Same as upsert() but runs over multiple documents.
   * Improves performance compared to running many upsert() calls.
   * @param data
   */
  async upsertBulk(
    data: Partial<T>[]
  ): Promise<{ success: RxDocument<T>[]; error: RxStorageWriteError<T>[] }> {
    await this.ensureCollection();
    return this.collection.bulkUpsert(data);
  }

  /**
   * Updates the document in the database by finding one with the matching id.
   * @param id
   * @param data
   */
  async set(id: string, data: Partial<T>): Promise<RxDocument<T> | null> {
    await this.ensureCollection();
    return this.collection.findOne(id).update({ $set: data });
  }

  /**
   * Updates many documents with same data by query
   * @param query
   * @param data
   */
  async updateBulk(query: MangoQuery<T>, data: Partial<T>): Promise<RxDocument<T, {}>[]> {
    await this.ensureCollection();
    return this.collection.find(query).update({ $set: data });
  }

  /**
   * Removes the document from the database by finding one with the matching id.
   * @param id
   */
  async remove(id: string): Promise<RxDocument<T> | null> {
    await this.ensureCollection();
    return this.collection.findOne(id).remove();
  }

  /**
   * Removes many documents at once
   * @param params
   */
  async removeBulk(
    params: string[] | MangoQuery<T>
  ): Promise<{ success: RxDocument<T>[]; error: RxStorageWriteError<T>[] }> {
    await this.ensureCollection();
    if (Array.isArray(params)) {
      return this.collection.bulkRemove(params);
    }
    const result = await this.collection
      .find(params)
      .remove()
      .catch(() => new Map());
    return {
      success: [...result.values()],
      error: [],
    };
  }

  /**
   * Removes all known data of the collection and its previous versions.
   * This removes the documents, the schemas, and older schemaVersions
   */
  async clear(): Promise<void> {
    await this.ensureCollection();
    return this.collection.remove();
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
      NgxRxdbUtils.debug('get local')
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

  private async init(dbService: NgxRxdbService, config: RxCollectionCreatorExtended) {
    try {
      this._collection = await dbService.initCollection(config);
      this._init$.next(true);
      this._init$.complete();
    } catch (e) {
      // @see rx-database-internal-store.ts:isDatabaseStateVersionCompatibleWithDatabaseCode
      // @see test/unit/data-migration.test.ts#L16
      if (e.message.includes('DM5')) {
        NgxRxdbUtils.logger.log(
          `Database version conflict.
          Opening an older RxDB database state with a new major version should throw an error`
        );
        // await dbService.db.destroy();
        throw new Error(e);
      } else {
        this._init$.complete();
        throw new Error(e.message ?? e);
      }
    }
  }

  private async ensureCollection(): Promise<boolean> {
    if (!this.collection) {
      await lastValueFrom(this.initialized$).catch(() => {
        throw new Error(
          `Collection "${this.config.name}" was not initialized. Please check previous RxDB errors.`
        );
      });
    }
    return true;
  }
}
