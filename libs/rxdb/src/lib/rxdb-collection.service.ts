// tslint:disable:variable-name
import { Injectable, OnDestroy } from '@angular/core';
import {
  isRxCollection,
  MangoQuery,
  RxCollection,
  RxDocument,
  RxLocalDocument,
  RxReplicationState,
} from 'rxdb';
import { defer, from, Observable, ReplaySubject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { NgxRxdbCollectionDump } from './rxdb-collection.class';
import { AnyObject, NgxRxdbCollectionConfig } from './rxdb.interface';
import { NgxRxdbService } from './rxdb.service';

@Injectable()
export class NgxRxdbCollectionService<T = AnyObject> implements OnDestroy {
  private inited$: ReplaySubject<boolean>;
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

  async ngOnDestroy() {
    // tslint:disable-next-line:no-unused-expression
    isRxCollection(this.collection) && (await this.collection.destroy());
  }

  /**  */
  collectionLoaded$(): Observable<boolean> {
    if (this.inited$) {
      return this.inited$.asObservable();
    }
    this.inited$ = new ReplaySubject();
    this.dbService.initCollection(this.config).then(collection => {
      this._collection = collection;
      this.inited$.next(true);
      this.inited$.complete();
    });
    return this.inited$.asObservable();
  }

  sync(
    remoteDbName: string = 'db',
    customHeaders?: { [h: string]: string }
  ): RxReplicationState {
    return this.dbService.syncCollection(this.collection, remoteDbName, customHeaders);
  }

  import(docs: T[]) {
    // preload data into collection
    return this.collectionLoaded$().pipe(
      switchMap(() => {
        const dump = new NgxRxdbCollectionDump<T>({
          name: this.collection.name,
          schemaHash: this.collection.schema.hash,
          docs,
        });
        return from(this.collection.importDump(dump));
      })
    );
  }

  docs(queryObj: MangoQuery<T>): Observable<RxDocument<T>[]> {
    return this.collectionLoaded$().pipe(switchMap(() => this.collection.find(queryObj).$));
  }

  allDocs(): Observable<RxDocument<T>[]> {
    return defer(async () => {
      try {
        const docs = await this.collection.pouch.allDocs({
          include_docs: true,
          attachments: false,
          startkey: '_design\uffff', // INFO: to skip design docs
        });
        return docs.rows.map(({ doc, id }) => ({ ...doc, id }));
      } catch {
        return [];
      }
    });
  }

  insertLocal(id: string, data: any): Observable<RxLocalDocument<any>> {
    return from(this.collection.upsertLocal(id, data));
  }

  getLocal(id: string): Observable<RxLocalDocument<any>> {
    return this.collectionLoaded$().pipe(
      switchMap(() => from(this.collection.getLocal(id)))
    );
  }

  updateLocal(id: string, prop: string, value: any): Observable<any> {
    return defer(async () => {
      const localDoc = await this.collection.getLocal(id);
      // change data
      localDoc.set(prop, value);
      await localDoc.save();
    });
  }

  removeLocal(id: string): Observable<any> {
    return defer(async () => {
      const localDoc = await this.collection.getLocal(id);
      return localDoc.remove();
    });
  }

  get(id: string): Observable<RxDocument<T>> {
    return this.collectionLoaded$().pipe(
      switchMap(() => from(this.collection.findOne(id).exec()))
    );
  }

  getById(id: string): Observable<RxDocument<T>> {
    return this.collectionLoaded$().pipe(
      switchMap(() =>
        this.collection.findByIds$([id]).pipe(map(r => (r.size ? r.get(id) : null)))
      )
    );
  }

  insert(data: T): Observable<RxDocument<T>> {
    return from(this.collection.insert(data));
  }

  bulkInsert(data: T[]): Observable<{ success: RxDocument<T>[]; error: any }> {
    return from(this.collection.bulkInsert(data));
  }

  upsert(data: T): Observable<RxDocument<T>> {
    return from(this.collection.upsert(data));
  }

  update(id: string, data: Partial<T>): Observable<RxDocument<T>> {
    return defer(async () => {
      const doc = await this.collection.findOne(id).exec();
      return doc.update({ $set: { ...data } });
    });
  }

  set(id: string, prop: string, value: any): Observable<boolean> {
    return defer(async () => {
      const doc = await this.collection.findOne(id).exec();
      doc.set(prop, value);
      return doc.save();
    });
  }

  remove(id: string): Observable<boolean> {
    return defer(async () => {
      const doc = await this.collection.findOne(id).exec();
      return doc.remove();
    });
  }

  removeBulkBy(queryObj: MangoQuery<T>): Observable<any> {
    return this.collectionLoaded$().pipe(
      switchMap(() => from(this.collection.find(queryObj).remove()))
    );
  }

  /**
   * updates all docs by given query
   * also represents a way to use 'pouch.bulkDocs' with RxDb
   */
  updateBulkBy(
    queryObj: MangoQuery<T>,
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
        const docs = await this.collection.find(queryObj).exec();
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
}
