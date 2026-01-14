
import type {
  RxCollectionExtended as RxCollection,
  RxCollectionCreatorExtended,
  RxCollectionHooks,
  RxDbMetadata,
} from '@ngx-odm/rxdb/config';
import { RxDBService } from '@ngx-odm/rxdb/core';
import {
  Entity,
  EntityId,
  NgxRxdbUtils,
  isValidRxReplicationState,
  mapFindResultToJsonArray,
} from '@ngx-odm/rxdb/utils';
import type {
  MangoQuery,
  RxAttachmentCreator,
  RxDatabase,
  RxDatabaseCreator,
  RxDocument,
  RxDumpCollection,
  RxDumpCollectionAny,
  RxLocalDocument,
  RxStorageWriteError,
  RxCollection as _RxCollection,
} from 'rxdb';
import { RXJS_SHARE_REPLAY_DEFAULTS, RxError, removeRxDatabase } from 'rxdb';
import { RxReplicationState } from 'rxdb/plugins/replication';
import {
  Observable,
  ReplaySubject,
  distinctUntilChanged,
  fromEvent,
  isObservable,
  map,
  of,
  shareReplay,
  switchMap,
  takeWhile,
} from 'rxjs';
import { ZoneLike, ensureCollection, ensureCollection$, runInZone } from './helpers';

const { getMaybeId, logger, debug, noop } = NgxRxdbUtils;

/**
 * Service for interacting with a RxDB {@link RxCollection}.
 */
export class RxDBCollectionService<T extends Entity = { id: EntityId }> {
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

  get queryParams$(): Observable<MangoQuery<T>> {
    if (!this.config.options?.useQueryParams) {
      return of({});
    }
    return this.initialized$.pipe(switchMap(() => this.collection.queryParams!.$));
  }

  constructor(
    public readonly config: RxCollectionCreatorExtended,
    protected readonly dbService: RxDBService,
    protected readonly ngZone: ZoneLike = {} as any,
    protected readonly currentUrl$: Observable<string> = of(''),
    protected readonly updateQueryParamsFn: any = noop
  ) {
    this.init(config);
  }

  /**
   * Destroys the collection's object instance. This is to free up memory and stop all observers and replications.
   */
  destroy(): void {
    this.collection?.destroy();
  }

  /**
   * Sets stored query for the collection.
   * @param query The Mango query object.
   */
  setQueryParams(query: MangoQuery<T>): void {
    this.collection.queryParams?.set(query);
  }

  /**
   * Patch stored query of the collection.
   * @param query The query parameters to patch.
   */
  patchQueryParams(query: MangoQuery<T>): void {
    this.collection.queryParams?.patch(query);
  }

  /**
   * Synchronizes the collection with a remote database.
   * If a replication state factory is provided in the configuration options, a new replication state will be created.
   * If a replication state already exists, it will be re-synced.
   * The replication will automatically start if the autoStart option is enabled.
   * The replication will also re-sync when the device goes back online.
   * @returns A promise that resolves when the synchronization is complete.
   */
  @ensureCollection()
  async sync(): Promise<void> {
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
   * Some useful information about the DB & collection collected by `prepare` plugin -
   * a mix of the internal data that is used by the storage engine and DB
   * @returns {RxDbMetadata}
   @example ```
    {
      "id": "collection|todo-3",
      "databaseName": "demo",
      "collectionName": "todo",
      "storageName": "dexie",
      "last_modified": 1708684412052,
      "rev": 2,
      "isFirstTimeInstantiated": false
    }
    ```
   */
  @ensureCollection()
  async info(): Promise<RxDbMetadata> {
    return this.collection.getMetadata();
  }

  /**
   * Imports the json dump into your collection
   * @param docs
   */
  @ensureCollection()
  async import(docs: T[]): Promise<void> {
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
  @ensureCollection()
  async export(): Promise<RxDumpCollection<T>> {
    return this.collection.exportJSON();
  }

  /**
   * Finds documents in your collection
   * Calling this will return an rxjs-Observable which streams every change to data of this collection.
   * @param query
   * @param withRevAndAttachments
   */
  @ensureCollection$()
  docs(
    query?: MangoQuery<T> | Observable<MangoQuery<T>>,
    withRevAndAttachments = false
  ): Observable<T[]> {
    return (isObservable(query) ? query : of(query)).pipe(
      switchMap(q => this.collection.find(q).$),
      mapFindResultToJsonArray(withRevAndAttachments),
      runInZone(this.ngZone),
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
  @ensureCollection$()
  docsByIds(ids: string[], withRevAndAttachments = false): Observable<T[]> {
    return this.collection.findByIds(ids).$.pipe(
      // prettier-ignore
      mapFindResultToJsonArray(withRevAndAttachments),
      runInZone(this.ngZone),
      shareReplay(RXJS_SHARE_REPLAY_DEFAULTS)
    );
  }

  /**
   * When you only need the amount of documents that match a query, but you do not need the document data itself, you can use a count query for better performance.
   * The performance difference compared to a normal query differs depending on which RxStorage implementation is used.
   * @param query
   */
  @ensureCollection$()
  count(query?: MangoQuery<T>): Observable<number> {
    return this.collection.count(query).$.pipe(
      // prettier-ignore
      runInZone(this.ngZone),
      shareReplay(RXJS_SHARE_REPLAY_DEFAULTS)
    );
  }

  /**
   * This does basically what find() does, but it returns only a single document.
   * @param id
   * @param withRevAndAttachments
   */
  @ensureCollection$()
  get(id: string, withRevAndAttachments = false): Observable<T | null> {
    return this.collection.findOne(id).$.pipe(
      map(doc => (doc ? doc.toMutableJSON(withRevAndAttachments as true) : null)),
      runInZone(this.ngZone),
      shareReplay(RXJS_SHARE_REPLAY_DEFAULTS)
    );
  }

  /**
   * Inserts new document into the database.
   * The collection will validate the schema and automatically encrypt any encrypted fields
   * @param data
   */
  @ensureCollection()
  async insert(data: T): Promise<RxDocument<T>> {
    return this.collection.insert(data);
  }

  /**
   * When you have to insert many documents at once, use bulk insert.
   * This is much faster than calling .insert() multiple times.
   * @param data
   */
  @ensureCollection()
  async insertBulk(
    data: T[]
  ): Promise<{ success: RxDocument<T>[]; error: RxStorageWriteError<T>[] }> {
    return this.collection.bulkInsert(data);
  }

  /**
   * Inserts the document if it does not exist within the collection, otherwise it will overwrite it. Returns the new or overwritten RxDocument.
   * @param data
   */
  @ensureCollection()
  async upsert(data: T): Promise<RxDocument<T>> {
    return this.collection.upsert(data);
  }

  /**
   * Same as upsert() but runs over multiple documents.
   * Improves performance compared to running many upsert() calls.
   * @param data
   */
  @ensureCollection()
  async upsertBulk(
    data: Partial<T>[]
  ): Promise<{ success: RxDocument<T>[]; error: RxStorageWriteError<T>[] }> {
    return this.collection.bulkUpsert(data);
  }

  /**
   * Updates the document in the database by finding one with the matching id.
   * @param id
   * @param data
   */
  @ensureCollection()
  async set(id: string, data: Partial<T>): Promise<RxDocument<T> | null> {
    return this.collection.findOne(id).update({ $set: data });
  }

  /**
   * Updates many documents with same data by query
   * @param query
   * @param data
   */
  @ensureCollection()
  async updateBulk(query: MangoQuery<T>, data: Partial<T>): Promise<RxDocument<T, {}>[]> {
    return this.collection.find(query).update({ $set: data });
  }

  /**
   * Removes the document from the database by finding one with the matching id.
   * @param entityOrId
   */
  @ensureCollection()
  async remove(entityOrId: T | string): Promise<RxDocument<T> | null> {
    const id = getMaybeId(entityOrId);
    return this.collection.findOne(id).remove();
  }

  /**
   * Removes many documents at once
   * @param params
   */
  @ensureCollection()
  async removeBulk(
    params: string[] | MangoQuery<T>
  ): Promise<{ success: RxDocument<T>[]; error: RxStorageWriteError<T>[] }> {
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
  @ensureCollection()
  async clear(): Promise<void> {
    return this.collection.remove();
  }

  /**
   * Returns an array of Blobs of all attachments of the RxDocument.
   * @param docId
   */
  @ensureCollection()
  async getAttachments(docId: string): Promise<Blob[] | null> {
    const doc = await this.collection.findOne(docId).exec();
    if (!doc) {
      return null;
    }
    const attachmentsData = doc.allAttachments().map(a => a.getData());
    return Promise.all(attachmentsData);
  }

  /**
   * Returns data of an RxAttachment by its id. Returns null when the attachment does not exist.
   * @param docId
   * @param attachmentId
   */
  @ensureCollection()
  async getAttachmentById(docId: string, attachmentId: string): Promise<Blob | null> {
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

  /**
   * Adds an attachment to a RxDocumen
   * @param docId
   * @param attachment
   */
  @ensureCollection()
  async putAttachment(docId: string, attachment: RxAttachmentCreator): Promise<void> {
    const doc = await this.collection.findOne(docId).exec();
    if (!doc) {
      return;
    }
    await doc.putAttachment(attachment);
  }

  /**
   * Removes the attachment
   * @param docId
   * @param attachmentId
   */
  @ensureCollection()
  async removeAttachment(docId: string, attachmentId: string): Promise<void> {
    const doc = await this.collection.findOne(docId).exec();
    if (!doc) {
      return;
    }
    const attachment = doc.getAttachment(attachmentId);
    if (!attachment) {
      return;
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
  @ensureCollection()
  async addHook<Hook extends RxCollectionHooks>(
    hook: Hook,
    handler: Parameters<RxCollection<T>[Hook]>[0],
    parralel = false
  ): Promise<void> {
    // Type 'RxCollectionHookNoInstanceCallback<T, {}>' is not assignable to type 'RxCollectionHookCallback<T, {}>'.

    this.collection[hook](handler as any, parralel);
  }

  // ---------------------------------------------------------------------------
  // Local Documents wrappers @see https://rxdb.info/rx-local-document.html
  // ---------------------------------------------------------------------------

  async getLocal<L extends Record<string, any>>(id: string): Promise<L | null>;
  async getLocal<L extends Record<string, any>, K = keyof L>(
    id: string,
    key: K
  ): Promise<L[keyof L] | null>;
  @ensureCollection()
  async getLocal<L extends Record<string, any>, K extends keyof L>(
    id: string,
    key?: K
  ): Promise<(K extends never ? L : L[K]) | null> {
    const doc = await this.collection.getLocal<L>(id);
    if (!doc) {
      return null;
    }
    return key ? doc?.get(key as string) : (doc?.toJSON().data as any);
  }

  getLocal$<L extends Record<string, any>, K = keyof L>(
    id: string,
    key: K
  ): Observable<L[keyof L] | null>;
  getLocal$<L extends Record<string, any>>(id: string): Observable<L | null>;
  @ensureCollection$()
  getLocal$<L extends Record<string, any>, K extends keyof L>(
    id: string,
    key?: K
  ): Observable<(K extends never ? L : L[K]) | null> {
    return this.collection.getLocal$<L>(id).pipe(
      map(doc => {
        if (!doc) {
          return null;
        }
        return key ? doc.get(key as string) : doc.toJSON().data;
      }),
      distinctUntilChanged(),
      runInZone(this.ngZone)
    );
  }

  /**
   * Inserts a local document with the specified id and data into the collection's local documents
   * @param id
   * @param data
   */
  @ensureCollection()
  async insertLocal<L extends object>(id: string, data: L): Promise<void> {
    await this.collection.insertLocal<L>(id, data);
  }

  /**
   * Upserts a local document with the given id and data
   * @param id
   * @param data
   */
  @ensureCollection()
  async upsertLocal<L extends object>(id: string, data: L): Promise<void> {
    await this.collection.upsertLocal<L>(id, data);
  }

  /**
   * Sets a local property value for a document in the collection.
   * @param id
   * @param prop
   * @param value
   */
  @ensureCollection()
  async setLocal<L extends object, K = keyof L>(
    id: string,
    prop: K,
    value: unknown
  ): Promise<void> {
    const loc = await this.collection.getLocal<L>(id);
    // INFO: as of RxDB version 15.3.0, local doc method `set` is missing
    // so we update whole document
    await this.collection.upsertLocal<L>(id, {
      ...(loc?.toJSON?.()?.data || {}),
      [prop as string]: value,
    } as L);
  }

  /**
   * Removes a local document from the collection.
   * @param id
   */
  @ensureCollection()
  async removeLocal(id: string): Promise<void> {
    const doc: RxLocalDocument<unknown> | null = await this.collection.getLocal(id);
    await doc?.remove();
  }

  private async init(config: RxCollectionCreatorExtended) {
    const { name, options } = config;
    try {
      await this.dbService.initCollections({
        [name]: config,
      });
      this._collection = this.db.collections[name] as RxCollection<T>;
      // Init query params plugin
      if (options?.useQueryParams) {
        this.collection.queryParamsInit!(this.currentUrl$, this.updateQueryParamsFn);
      }
      this._init$.next(true);
      this._init$.complete();
    } catch (err) {
      // @see rx-database-internal-store.ts:isDatabaseStateVersionCompatibleWithDatabaseCode
      // @see test/unit/data-migration.test.ts#L16
      if (
        err.message.includes('DM5') ||
        (err.message.includes('DB6') &&
          (err as RxError).parameters.previousSchema?.version ===
            (err as RxError).parameters.schema?.version)
      ) {
        logger.log(
          'Reload the page to fix the issue. The database is in a state where it can not be used.'
        );
        await removeRxDatabase(this.db.name, this.db.storage);
        window?.location?.reload?.();
      } else {
        this._init$.complete();
        throw err;
      }
    }
  }
}
