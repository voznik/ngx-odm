import { Injectable, OnDestroy } from '@angular/core';
import { RxCollectionBase } from 'rxdb/dist/types/rx-collection';
import {
  PouchAllDocsOptions,
  RxCollectionGenerated,
  RxDocumentBase,
  // RxQueryResult
} from 'rxdb/dist/types/types';
import {
  isRxCollection,
  MangoQuery,
  RxCollection,
  RxDocument,
  RxReplicationState,
} from 'rxdb/plugins/core';
import { defer, from, Observable, ReplaySubject, Subscribable } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { NgxRxdbCollectionDump } from './rxdb-collection.class';
import { NgxRxdbCollectionConfig } from './rxdb.d';
import { NgxRxdbService } from './rxdb.service';

// -----------------------------------------------------------------------------
type QueryResult<T> = RxDocument<T[]> | RxDocument<T>;
type LocalDocument = (RxDocumentBase<any> & { isLocal(): true }) | null;
type AllDocsOptions = PouchAllDocsOptions & PouchDB.Core.AllDocsWithinRangeOptions;
type CollectionFnNames =
  | FunctionPropertyNames<RxCollectionGenerated<any>>
  | FunctionPropertyNames<RxCollectionBase<any>>;
type CollectionFn = RxCollection<any>[CollectionFnNames];
type CollectionFnReturnType<K extends CollectionFnNames> = Awaited<
  ReturnType<RxCollection<any>[K]>
>;
// -----------------------------------------------------------------------------

@Injectable()
export class NgxRxdbCollectionService<T = AnyObject> implements OnDestroy {
  private _init$: ReplaySubject<boolean>;
  private _collection: RxCollection<T>;

  get collection() {
    return this._collection;
  }
  get db() {
    return this.dbService.db;
  }

  constructor(
    private dbService: NgxRxdbService,
    protected readonly config: NgxRxdbCollectionConfig
  ) {}

  /** @internal */
  async ngOnDestroy() {
    // eslint-disable-next-line no-unused-expressions
    isRxCollection(this.collection) && (await this.collection.destroy());
  }

  /**  */
  initialized$(): Observable<boolean> {
    if (this._init$) {
      return this._init$.asObservable();
    }
    this._init$ = new ReplaySubject();
    this.dbService.initCollection(this.config).then(collection => {
      this._collection = collection;
      this._init$.next(true);
      this._init$.complete();
    });
    return this._init$.asObservable();
  }

  sync(
    remoteDbName: string = 'db',
    customHeaders?: { [h: string]: string }
  ): RxReplicationState {
    return this.dbService.syncCollection(this.collection, remoteDbName, customHeaders);
  }

  /** import array of docs into collection */
  import(docs: T[]) {
    return this.initialized$().pipe(
      switchMap(() => {
        const dump = new NgxRxdbCollectionDump<T>({
          name: this.collection.name,
          schemaHash: this.collection.schema.hash,
          docs,
        });
        return this.collection.importDump(dump);
      })
    );
  }

  docs(query: MangoQuery<T>): Observable<RxDocument<T>[]> {
    return this.initialized$().pipe(switchMap(() => this.collection.find(query).$));
  }

  docsByIds(ids: string[]): Observable<RxDocument<T>[]> {
    return this.initialized$().pipe(
      switchMap(() => this.collection.findByIds$(ids)),
      map(result => [...result.values()])
    );
  }

  allDocs(options: AllDocsOptions): Observable<T[]> {
    const defaultOptions = {
      include_docs: true,
      attachments: false,
      startkey: '_design\uffff', // INFO: to skip design docs
    };
    return this.initialized$().pipe(
      switchMap(() => this.collection.pouch.allDocs({ ...defaultOptions, ...options })),
      map(result => result.rows.map(({ doc, id }) => ({ ...doc, id }))),
      catchError(() => [])
    );
  }

  get(id: string): Observable<RxDocument<T>> {
    return this.initialized$().pipe(switchMap(() => this.collection.findOne(id).exec()));
  }

  insert(data: T): Observable<RxDocument<T>> {
    return this.execute('insert', data);
  }

  insertBulk(data: T[]): Observable<{ success: RxDocument<T>[]; error: any }> {
    return this.execute('bulkInsert', data);
  }

  upsert(data: T): Observable<RxDocument<T>> {
    return this.execute('upsert', data);
  }

  set(id: string, data: Partial<T>): Observable<RxDocument<T>> {
    return this.initialized$().pipe(
      switchMap(() => this.collection.findOne(id).update({ $set: data }))
    );
  }

  updateBulk(query: MangoQuery<T>, data: Partial<T>): Observable<T[]> {
    return this.initialized$().pipe(
      switchMap(() => this.collection.find(query).update({ $set: data }))
    );
  }

  remove(id: string): Observable<any> {
    return this.initialized$().pipe(switchMap(() => this.collection.findOne(id).remove()));
  }

  removeBulk(query: MangoQuery<T>): Observable<any> {
    return this.initialized$().pipe(switchMap(() => this.collection.find(query).remove()));
  }

  /**
   * @deprecated
   * updates all docs by given query
   * also represents a way to use 'pouch.bulkDocs' with RxDb
   */
  _updateBulkByPouch(
    query: MangoQuery<T>,
    values: Partial<T>
  ): Observable<
    {
      ok: boolean;
      id: string;
      rev: string;
    }[]
  > {
    return defer(async () => {
      try {
        const docs = await this.collection.find(query).exec();
        if (docs && docs.length) {
          const docsToUpdate = docs.map(doc => ({
            _id: doc.primary,
            _rev: doc['_rev'],
            ...doc.toJSON(),
            ...values,
          }));
          return this.collection.pouch.bulkDocs(docsToUpdate);
        }
      } catch (error) {
        return null;
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Local Documents @see https://rxdb.info/rx-local-document.html
  // ---------------------------------------------------------------------------

  getLocal(id: string): Observable<LocalDocument> {
    return this.execute('getLocal', id);
  }

  insertLocal(id: string, data: any): Observable<LocalDocument> {
    return this.execute('insertLocal', id, data);
  }

  upsertLocal(id: string, data: any): Observable<LocalDocument> {
    return this.execute('upsertLocal', id, data);
  }

  setLocal(id: string, prop: string, value: any): Observable<any> {
    return defer(async () => {
      const localDoc: LocalDocument = await this.collection.getLocal(id);
      // change data
      localDoc.set(prop, value);
      await localDoc.save();
    });
  }

  removeLocal(id: string): Observable<boolean> {
    return this.getLocal(id).pipe(switchMap(doc => doc.remove()));
  }

  /**
   * @description wraps RxCollection methods execution in observable, type safe
   * @param method
   * @param args
   */
  private execute<K extends CollectionFnNames>(
    method: K,
    ...args: Parameters<RxCollection<any>[K]>
  ): Observable<CollectionFnReturnType<K>> {
    return this.initialized$().pipe(
      switchMap(() => {
        return this.collection[method].apply(this.collection, args) as
          | Subscribable<any>
          | PromiseLike<any>;
      })
    );
  }
}
