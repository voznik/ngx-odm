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
import { RxDBValidatePlugin } from 'rxdb/plugins/validate';
// NgxRxdb
import { NgxRxdbCollectionCreator } from './rxdb-collection.class';
import {
  NgxRxdbCollectionConfig,
  NgxRxdbConfig,
  NgxRxdbDump,
} from './rxdb.interface';
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
// only in development environment
if ((window as any).process?.env?.TEST) {
  logFn('dev or test mode');
  // addRxPlugin(require('pouchdb-adapter-memory'));
  // addRxPlugin(RxDBDevModePlugin); // FIXME: is it duplicate import ?
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
      // also can create collections from root config
      if (!isEmpty(config.options) && !isEmpty(config.options.schemas)) {
        await this.initCollections(config.options.schemas);
      }
      if (!isEmpty(config.options) && config.options.dumpPath) {
        // fetch dump json
        const dump = await (await fetch(config.options.dumpPath)).json();
        // import only new dump
        if (
          !this._imported ||
          this._imported !== dump['timestamp'].toString()
        ) {
          await this.importDbDump(dump);
        }
      }
    } catch (error) {
      throw new NgxRxdbError(error.message ?? error);
    }
  }

  async initCollections(schemaConfigs: {
    [key: string]: NgxRxdbCollectionConfig;
  }) {
    try {
      const collectionCreators = await this.prepareCollections(schemaConfigs);
      // use bulk `addCollections` method at the end of array
      const bulk = await this.dbInstance.addCollections(collectionCreators);
      logFn(
        `created ${Object.keys(bulk).length} collections bulk, `,
        Object.keys(bulk)
      );
    } catch (error) {
      throw new NgxRxdbError(error.message ?? error);
    }
  }

  async initCollection(schemaConfig: NgxRxdbCollectionConfig) {
    let collection: RxCollection = this.db[schemaConfig.name];
    if (isRxCollection(collection)) {
      // delete collection if exists
      if (schemaConfig.options.recreate) {
        return await collection.remove();
      }
      logFn('collection', collection.name, 'exists, skip create');
      return collection;
    }

    const collectionCreator = await this.prepareCollections({
      [schemaConfig.name]: schemaConfig,
    });
    collection = (await this.dbInstance.addCollections(collectionCreator))[
      schemaConfig.name
    ];
    logFn(`created collection "${collection.name}"`);
    // preload data into collection
    const docsCount = await collection.countAllDocuments();
    logFn(
      `collection "${collection.name}" has "${parseInt(docsCount, 0)}" docs`
    );
    if (schemaConfig.options?.initialDocs && !!!docsCount) {
      const dumpObj = {
        name,
        schemaHash: collection.schema.hash,
        encrypted: false,
        docs: [...schemaConfig.options.initialDocs],
      };
      await collection.importDump(dumpObj as any);
      logFn(
        `imported ${schemaConfig.options.initialDocs.length} docs for collection "${name}"`
      );
    }
    return collection;
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
      throw new NgxRxdbError(
        'collections must be initialized before importing dump'
      );
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
  async importDbDump(dumpObj: NgxRxdbDump) {
    try {
      const dump = this.prepareDump(dumpObj);
      await this.db.importDump(dump as any);
      this._imported = dump.timestamp;
    } catch (error) {
      if (error.status !== 409) {
        throw new NgxRxdbError(error.message ?? error);
      } else {
        // impoted but were conflicts with old docs - mark as imported
        this._imported = dumpObj.timestamp;
      }
    }
  }

  private async prepareCollections(schemaConfigs: {
    [key: string]: NgxRxdbCollectionConfig;
  }): Promise<{ [key: string]: RxCollectionCreator }> {
    try {
      const collectionCreators = {};
      const configs = Object.values(schemaConfigs);
      for (const config of configs) {
        // optionally fetch schema from remote url
        if (!config.schema && !!config.options.schemaUrl) {
          config.schema = await NgxRxdbCollectionCreator.fetchSchema(
            config.options.schemaUrl
          );
        }
        checkSchema(config.schema);
        collectionCreators[config.name] = new NgxRxdbCollectionCreator(config);
      }
      return collectionCreators;
    } catch (error) {
      throw new NgxRxdbError(error.message ?? error);
    }
  }

  /** change schemaHashes from dump to existing schema hashes */
  private prepareDump(dumpObj: NgxRxdbDump): NgxRxdbDump {
    const dumpWithHashes = { ...dumpObj };
    if (isEmpty(this.collections)) {
      throw new NgxRxdbError(
        'collections must be initialized before importing dump'
      );
    }
    for (const key in this.collections) {
      if (dumpWithHashes.collections.hasOwnProperty(key)) {
        dumpWithHashes.collections[key].schemaHash = this.collections[
          key
        ].schema['_hash'];
      }
    }
    return dumpWithHashes;
  }
}
