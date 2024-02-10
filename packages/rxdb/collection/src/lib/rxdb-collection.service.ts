/* eslint-disable @typescript-eslint/ban-types */
import { InjectionToken, NgZone, inject } from '@angular/core';
import type {
  RxCollectionExtended as RxCollection,
  RxCollectionCreatorExtended,
  RxCollectionHooks,
  RxDbMetadata,
} from '@ngx-odm/rxdb/config';
import { NgxRxdbService } from '@ngx-odm/rxdb/core';
import { CURRENT_URL, updateQueryParams } from '@ngx-odm/rxdb/query-params';
import {
  NgxRxdbUtils,
  isValidRxReplicationState,
  mapFindResultToJsonArray,
} from '@ngx-odm/rxdb/utils';
import {
  FilledMangoQuery,
  RXJS_SHARE_REPLAY_DEFAULTS,
  type MangoQuery,
  type RxDatabase,
  type RxDatabaseCreator,
  type RxDocument,
  type RxDumpCollection,
  type RxDumpCollectionAny,
  type RxLocalDocument,
  type RxStorageWriteError,
  type RxCollection as _RxCollection,
  RxAttachment,
  RxAttachmentCreator,
} from 'rxdb';
import { RxReplicationState } from 'rxdb/plugins/replication';
import {
  Observable,
  ReplaySubject,
  distinctUntilChanged,
  fromEvent,
  isObservable,
  lastValueFrom,
  map,
  merge,
  of,
  shareReplay,
  startWith,
  switchMap,
  takeWhile,
} from 'rxjs';

const { getMaybeId, logger, debug, runInZone } = NgxRxdbUtils;

type EntityId = string;
type Entity = { id: EntityId };

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
  return (): NgxRxdbCollection => new NgxRxdbCollection(config);
}

/**
 * Service for interacting with a RxDB {@link RxCollection}.
 */
export class NgxRxdbCollection<T extends Entity = { id: EntityId }> {
  protected readonly dbService: NgxRxdbService = inject(NgxRxdbService);
  protected readonly ngZone: NgZone = inject(NgZone);
  protected readonly currentUrl$ = inject(CURRENT_URL);
  protected readonly updateQueryParamsFn = inject(updateQueryParams);
  private _collection!: RxCollection<T>;
  private _replicationState: RxReplicationState<T, unknown> | null = null;
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

  get replicationState(): RxReplicationState<T, unknown> | null {
    return this._replicationState;
  }

  get queryParams$(): Observable<FilledMangoQuery<T>> {
    return this.initialized$.pipe(switchMap(() => this.collection.queryParams$));
  }

  constructor(public readonly config: RxCollectionCreatorExtended) {
    this.init(config);
  }

  /**
   * Destroys the collection's object instance. This is to free up memory and stop all observers and replications.
   */
  destroy(): void {
    this.collection?.destroy();
  }

  setQueryParams(query: MangoQuery<T>): void {
    this.collection.queryParamsSet(query);
  }

  patchQueryParams(query: MangoQuery<T>): void {
    this.collection.queryParamsPatch(query);
  }

  async sync(): Promise<void> {
    await this.ensureCollection();
    if (isValidRxReplicationState(this.replicationState)) {
      this.replicationState.reSync();
      return;
    }

    if (typeof this.config.options?.replicationStateFactory !== 'function') {
      return;
    }

    try {
      this._replicationState = this.config.options.replicationStateFactory(
        this.collection as _RxCollection<T>
      ) as RxReplicationState<T, unknown>;
    } catch (error) {
      logger.log('replicationState has error, ignore replication');
      logger.log(error.message);
    }

    if (isValidRxReplicationState(this.replicationState)) {
      if (!this.replicationState.autoStart) {
        this.replicationState.reSync();
      }

      // Re-sync replication when back online
      fromEvent(window, 'online')
        .pipe(
          debug('online'),
          takeWhile(() => !this.replicationState!.isStopped())
        )
        .subscribe(() => {
          this._replicationState!.reSync();
        });

      return this.replicationState.startPromise;
    }
  }

  /**
   * Returns the internal data that is used by the storage engine
   */
  async info(): Promise<RxDbMetadata> {
    await this.ensureCollection();
    const meta = await this.collection.getMetadata();
    logger.log('metadata:', { meta });
    return meta;
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
   * @param withRevAndAttachments
   */
  docs(
    query?: MangoQuery<T> | Observable<MangoQuery<T>>,
    withRevAndAttachments = false
  ): Observable<T[]> {
    return this.initialized$.pipe(
      switchMap(() => (isObservable(query) ? query : of(query))),
      switchMap(q => this.collection.find(q).$),
      mapFindResultToJsonArray(withRevAndAttachments),
      runInZone(this.ngZone),
      debug('docs'),
      shareReplay(RXJS_SHARE_REPLAY_DEFAULTS)
    );
  }

  /**
   * Finds many documents by their id (primary value).
   * This has a way better performance than running multiple findOne() or a find() with a big $or selector.
   *
   * Calling this will return an rxjs-Observable which streams every change to data of this collection.
   * Documents that do not exist or are deleted, will be skipped
   * @param ids
   * @param withRevAndAttachments
   */
  docsByIds(ids: string[], withRevAndAttachments = false): Observable<T[]> {
    return this.initialized$.pipe(
      switchMap(() => this.collection.findByIds(ids).$),
      mapFindResultToJsonArray(withRevAndAttachments),
      runInZone(this.ngZone),
      debug('docsByIds'),
      shareReplay(RXJS_SHARE_REPLAY_DEFAULTS)
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
      runInZone(this.ngZone),
      debug('count'),
      shareReplay(RXJS_SHARE_REPLAY_DEFAULTS)
    );
  }

  /**
   * This does basically what find() does, but it returns only a single document.
   * You can pass a primary value to find a single document more easily.
   * @param id
   * @param withRevAndAttachments
   */
  get(id: string, withRevAndAttachments = false): Observable<T | null> {
    return this.initialized$.pipe(
      switchMap(() => this.collection.findOne(id).$),
      map(doc => (doc ? doc.toMutableJSON(withRevAndAttachments as true) : null)),
      runInZone(this.ngZone),
      debug('get one'),
      shareReplay(RXJS_SHARE_REPLAY_DEFAULTS)
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
  async upsert(data: T): Promise<RxDocument<T>> {
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
   * @param entityOrId
   */
  async remove(entityOrId: T | string): Promise<RxDocument<T> | null> {
    await this.ensureCollection();
    const id = getMaybeId(entityOrId);
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

  async getAttachments(docId: string): Promise<Blob[] | null> {
    await this.ensureCollection();
    const doc = await this.collection.findOne(docId).exec();
    if (!doc) {
      return null;
    }
    const attachmentsData = doc.allAttachments().map(a => a.getData());
    return Promise.all(attachmentsData);
  }

  async getAttachmentById(docId: string, attachmentId: string): Promise<Blob | null> {
    await this.ensureCollection();
    const doc = await this.collection.findOne(docId).exec();
    if (!doc) {
      return null;
    }
    const attachment = doc.getAttachment(attachmentId);
    if (!attachment) {
      return null;
    }
    return attachment.getData();
  }

  async putAttachment(docId: string, attachment: RxAttachmentCreator): Promise<void> {
    await this.ensureCollection();
    const doc = await this.collection.findOne(docId).exec();
    if (!doc) {
      throw new Error(`Document with id "${docId}" not found.`);
    }
    await doc.putAttachment(attachment);
  }

  async removeAttachment(docId: string, attachmentId: string): Promise<void> {
    await this.ensureCollection();
    const doc = await this.collection.findOne(docId).exec();
    if (!doc) {
      throw new Error(`Document with id "${docId}" not found.`);
    }
    const attachment = doc.getAttachment(attachmentId);
    if (!attachment) {
      throw new Error(`Attachment with id "${attachmentId}" not found.`);
    }
    await attachment.remove();
  }

  /**
   * Add one of RxDB-supported middleware-hooks to current collection, e.g run smth on document postSave.
   * By default runs in series
   * @param hook
   * @param handler
   * @param parralel
   * @see https://rxdb.info/middleware.html
   */
  async addHook<Hook extends RxCollectionHooks>(
    hook: Hook,
    handler: Parameters<RxCollection<T>[Hook]>[0],
    parralel = false
  ): Promise<void> {
    await this.ensureCollection();
    // Type 'RxCollectionHookNoInstanceCallback<T, {}>' is not assignable to type 'RxCollectionHookCallback<T, {}>'.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.collection[hook](handler as any, parralel);
  }

  // ---------------------------------------------------------------------------
  // Local Documents wrappers @see https://rxdb.info/rx-local-document.html
  // ---------------------------------------------------------------------------
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unnecessary-type-constraint */

  async getLocal<L extends Record<string, any>>(id: string): Promise<L | null>;
  async getLocal<L extends Record<string, any>, K = keyof L>(
    id: string,
    key: K
  ): Promise<L[keyof L] | null>;
  async getLocal<L extends Record<string, any>, K extends keyof L>(
    id: string,
    key?: K
  ): Promise<(K extends never ? L : L[K]) | null> {
    await this.ensureCollection();
    const doc = await this.collection.getLocal<L>(id);
    logger.log('local document', doc);
    if (!doc) {
      return null;
    }
    return key ? doc?.get(key as string) : doc?.toJSON().data;
  }

  getLocal$<L extends Record<string, any>, K = keyof L>(
    id: string,
    key: K
  ): Observable<L[keyof L] | null>;
  getLocal$<L extends Record<string, any>>(id: string): Observable<L | null>;
  getLocal$<L extends Record<string, any>, K extends keyof L>(
    id: string,
    key?: K
  ): Observable<(K extends never ? L : L[K]) | null> {
    return this.initialized$.pipe(
      switchMap(() => this.collection.getLocal$<L>(id)),
      map(doc => {
        if (!doc) {
          return null;
        }
        return key ? doc.get(key as string) : doc.toJSON().data;
      }),
      distinctUntilChanged(),
      runInZone(this.ngZone),
      debug('local document')
    );
  }

  async insertLocal<L extends object>(id: string, data: L): Promise<void> {
    await this.ensureCollection();
    await this.collection.insertLocal<L>(id, data);
  }

  async upsertLocal<L extends object>(id: string, data: L): Promise<void> {
    await this.ensureCollection();
    await this.collection.upsertLocal<L>(id, data);
  }

  /**
   * @param id
   * @param prop
   * @param value
   */
  async setLocal<L extends object, K = keyof L>(
    id: string,
    prop: K,
    value: unknown
  ): Promise<void> {
    await this.ensureCollection();
    const loc = await this.collection.getLocal<L>(id);
    if (!loc) {
      return;
    }
    // INFO: as of RxDB version 15.3.0, local doc method `set` is missing
    // so we update whole document
    await this.collection.upsertLocal<L>(id, {
      ...loc?.toJSON().data,
      [prop as string]: value,
    } as L);
  }

  async removeLocal(id: string): Promise<void> {
    await this.ensureCollection();
    const doc: RxLocalDocument<unknown> | null = await this.collection.getLocal(id);
    await doc?.remove();
  }
  /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unnecessary-type-constraint */

  private async init(config: RxCollectionCreatorExtended) {
    const { name } = config;
    try {
      await this.dbService.initCollections({
        [name]: config,
      });
      this._collection = this.db.collections[name] as RxCollection<T>;
      // Init query params plugin
      if (this.config.options?.useQueryParams) {
        this.collection.queryParamsInit(this.currentUrl$, this.updateQueryParamsFn);
      }
      this._init$.next(true);
      this._init$.complete();
    } catch (e) {
      // @see rx-database-internal-store.ts:isDatabaseStateVersionCompatibleWithDatabaseCode
      // @see test/unit/data-migration.test.ts#L16
      if (e.message.includes('DM5')) {
        logger.log(
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
