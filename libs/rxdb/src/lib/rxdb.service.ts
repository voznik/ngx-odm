// tslint:disable: no-string-literal no-var-requires
import { Injectable } from '@angular/core';
import {
  addRxPlugin,
  createRxDatabase,
  isRxCollection,
  RxCollection,
  RxCollectionCreator,
  RxDatabase,
  RxReplicationState,
} from 'rxdb';
import { RxDBAdapterCheckPlugin } from 'rxdb/plugins/adapter-check';
import { checkSchema } from 'rxdb/plugins/dev-mode';
import { RxDBJsonDumpPlugin } from 'rxdb/plugins/json-dump';
import { RxDBMigrationPlugin } from 'rxdb/plugins/migration';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { RxDBReplicationPlugin } from 'rxdb/plugins/replication';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { RxDBValidatePlugin } from 'rxdb/plugins/validate';
// NgxRxdb
import {
  NgxRxdbCollectionCreator,
  NgxRxdbCollectionDump,
  NgxRxdbDump,
} from './rxdb-collection.class';
import { NgxRxdbCollectionConfig, NgxRxdbConfig } from './rxdb.interface';
import { DEFAULT_BACKOFF_FN, RXDB_DEFAULT_CONFIG } from './rxdb.model';
import { isEmpty, logFn, NgxRxdbError } from './utils';

addRxPlugin(require('pouchdb-adapter-http')); // enable syncing over http (remote database)
addRxPlugin(require('pouchdb-adapter-idb'));
addRxPlugin(RxDBValidatePlugin);
addRxPlugin(RxDBQueryBuilderPlugin);
addRxPlugin(RxDBJsonDumpPlugin);
addRxPlugin(RxDBAdapterCheckPlugin);
addRxPlugin(RxDBMigrationPlugin);
addRxPlugin(RxDBReplicationPlugin);
addRxPlugin(RxDBUpdatePlugin);
// only in development environment
if ((window as any).process?.env?.TEST) {
  logFn('dev or test mode');
  // addRxPlugin(require('pouchdb-adapter-memory')); // FIXME: is it duplicate import ?
}

const IMPORTED_FLAG = '_ngx_rxdb_imported';

@Injectable()
export class NgxRxdbService {
  private dbInstance: RxDatabase;

  private static mergeConfig(config: NgxRxdbConfig): NgxRxdbConfig {
    return Object.assign({}, RXDB_DEFAULT_CONFIG, config);
  }

  static getCouchAuthProxyHeaders(
    userName: string = '',
    roles: string[] = [],
    token: string = ''
  ): { [h: string]: string } {
    return {
      'X-Auth-CouchDB-UserName': userName,
      'X-Auth-CouchDB-Roles': roles.join(','),
      'X-Auth-CouchDB-Token': token,
    };
  }

  get db(): RxDatabase {
    return this.dbInstance;
  }

  get collections(): { [key: string]: RxCollection } {
    return this.db.collections;
  }

  get _imported() {
    return window.localStorage[IMPORTED_FLAG];
  }
  set _imported(v) {
    window.localStorage[IMPORTED_FLAG] = v;
  }

  constructor() {
    this._imported = window.localStorage[IMPORTED_FLAG];
  }

  async destroyDb() {
    try {
      await this.dbInstance.remove();
      await this.dbInstance.destroy();
      this.dbInstance = null;
    } catch {}
  }

  /**
   * This is run via APP_INITIALIZER in app.module.ts
   * to ensure the database exists before the angular-app starts up
   */
  async initDb(config: NgxRxdbConfig) {
    try {
      const dbConfig = NgxRxdbService.mergeConfig(config);
      const db: RxDatabase = await createRxDatabase(dbConfig);
      this.dbInstance = db;
      logFn('created database');
      // TODO: should the instance becomes leader
      // await this.dbInstance.waitForLeadership();

      // optional: can create collections from root config
      if (!isEmpty(dbConfig.options?.schemas)) {
        await this.initCollections(dbConfig.options.schemas);
      }
      if (dbConfig.options?.dumpPath) {
        // fetch dump json
        const dump = await (await fetch(dbConfig.options.dumpPath)).json();
        // import only new dump
        if (!this._imported || this._imported !== dump.timestamp?.toString()) {
          await this.importDbDump(dump);
        }
      }
    } catch (error) {
      throw new NgxRxdbError(error.message ?? error);
    }
  }

  /** uses bulk `addCollections` method at the end of array */
  async initCollections(colConfigs: { [key: string]: NgxRxdbCollectionConfig }) {
    try {
      const colCreators = await this.prepareCollections(colConfigs);
      const bulk = await this.dbInstance.addCollections(colCreators);
      logFn(`created ${Object.keys(bulk).length} collections bulk, `, Object.keys(bulk));
    } catch (error) {
      throw new NgxRxdbError(error.message ?? error);
    }
  }

  async initCollection(colConfig: NgxRxdbCollectionConfig) {
    let col: RxCollection = this.db[colConfig.name];
    if (isRxCollection(col)) {
      // delete  data in collection if exists
      if (colConfig.options.recreate) {
        await col.remove();
      }
      logFn('collection', col.name, 'exists, skip create');
      return col;
    }

    const colCreator = await this.prepareCollections({
      [colConfig.name]: colConfig,
    });
    col = (await this.dbInstance.addCollections(colCreator))[colConfig.name];
    logFn(`created collection "${col.name}"`);

    if (colConfig.options?.initialDocs) {
      const info = await col.info();
      const count = await col.countAllDocuments();
      if (!count && info.update_seq <= 1) {
        logFn(`collection "${col.name}" has "${parseInt(count, 0)}" docs`);
        // preload data into collection
        const dump = new NgxRxdbCollectionDump({
          name: col.name,
          schemaHash: col.schema.hash,
          docs: colConfig.options.initialDocs,
        });
        await col.importDump(dump);
        logFn(
          `imported ${colConfig.options.initialDocs.length} docs for collection "${col.name}"`
        );
      }
    }

    return col;
  }

  getCollection(name: string): RxCollection {
    const collection: RxCollection = this.db[name];
    if (isRxCollection(collection)) {
      return collection;
    } else {
      logFn(`returned false for RxDB.isRxCollection(${name})`);
      return null;
    }
  }

  syncCollection(
    col: RxCollection,
    remoteDbName: string = 'db',
    customHeaders?: { [h: string]: string }
  ): RxReplicationState {
    if (col.options?.syncOptions?.remote) {
      const { syncOptions } = col.options as NgxRxdbCollectionConfig['options'];
      syncOptions.remote = syncOptions.remote.concat('/', remoteDbName);
      // merge options
      syncOptions.options = Object.assign(
        {
          back_off_function: DEFAULT_BACKOFF_FN,
        },
        this.db.pouchSettings.ajax,
        col.pouchSettings.ajax,
        syncOptions.options
      );
      // append auth headers
      if (customHeaders) {
        (syncOptions.options as any).headers = Object.assign(
          {},
          (syncOptions.options as any).headers,
          customHeaders
        );
      }
      // set filtered sync
      if (syncOptions.queryObj) {
        syncOptions.query = col.find(syncOptions.queryObj);
      }
      return col.sync(syncOptions);
    }
  }

  syncAllCollections(
    remoteDbName: string = 'db',
    customHeaders?: { [h: string]: string }
  ): RxReplicationState[] {
    if (isEmpty(this.collections)) {
      throw new NgxRxdbError('collections must be initialized before importing dump');
    }
    const replicationStates: RxReplicationState[] = [];
    Object.values(this.collections)
      .filter(col => 'remote' in col.options.syncOptions)
      .forEach(col => {
        const sync = this.syncCollection(col, remoteDbName, customHeaders);
        replicationStates.push(sync);
      });
    logFn('syncAllCollections = ', replicationStates);
    return replicationStates;
  }

  /**
   * imports pouchdb dump to the database, must be used only after db init
   */
  async importDbDump(dump: Partial<NgxRxdbDump>) {
    try {
      await this.db.importDump(this.prepareDbDump(dump));
      this._imported = dump.timestamp;
    } catch (error) {
      if (error.status !== 409) {
        throw new NgxRxdbError(error.message ?? error);
      } else {
        // impoted but were conflicts with old docs - mark as imported
        this._imported = dump.timestamp;
      }
    }
  }

  private async prepareCollections(colConfigs: {
    [key: string]: NgxRxdbCollectionConfig;
  }): Promise<{ [key: string]: RxCollectionCreator }> {
    try {
      const colCreators = {};
      const configs = Object.values(colConfigs);
      for (const config of configs) {
        // optionally fetch schema from remote url
        if (!config.schema && !!config.options.schemaUrl) {
          config.schema = await NgxRxdbCollectionCreator.fetchSchema(
            config.options.schemaUrl
          );
        }
        checkSchema(config.schema);
        colCreators[config.name] = new NgxRxdbCollectionCreator(config);
      }
      return colCreators;
    } catch (error) {
      throw new NgxRxdbError(error.message ?? error);
    }
  }

  /** change schemaHashes from dump to existing schema hashes */
  private prepareDbDump(dumpObj: Partial<NgxRxdbDump>): NgxRxdbDump {
    const dumpWithHashes = new NgxRxdbDump(dumpObj);
    if (isEmpty(this.collections)) {
      throw new NgxRxdbError('collections must be initialized before importing');
    }
    for (const dc of dumpWithHashes.collections) {
      const col = this.getCollection(dc.name);
      if (col) {
        dc.schemaHash = col.schema['_hash'];
      } else {
        throw new NgxRxdbError('no such collection as provided in dump');
      }
    }
    return dumpWithHashes;
  }
}
