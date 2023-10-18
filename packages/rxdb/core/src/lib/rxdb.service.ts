import { Inject, Injectable } from '@angular/core';
import {
  DEFAULT_BACKOFF_FN,
  NgxRxdbCollectionConfig,
  NgxRxdbConfig,
  RXDB_DEFAULT_CONFIG,
} from '@ngx-odm/rxdb/config';
import { forEach, isEmpty, LOCAL_STORAGE, logFn, merge } from '@ngx-odm/rxdb/utils';
//  INFO: Instead of using the default rxdb-import, we do a custom build which lets us cherry-pick only the modules that we need. A default import would be: import RxDB from 'rxdb';
import {
  CollectionsOfDatabase,
  createRxDatabase,
  isRxCollection,
  RxCollection,
  RxCollectionCreator,
  RxDatabase,
  RxReplicationState,
} from 'rxdb/plugins/core';
import { checkSchema } from 'rxdb/plugins/dev-mode';
import { NgxRxdbCollectionCreator } from './rxdb-collection.class';
import { NgxRxdbCollectionDump, NgxRxdbDump } from './rxdb-dump.class';
import { NgxRxdbError } from './rxdb-error.class';
import { loadRxDBPlugins } from './rxdb-plugin.loader';

const log = logFn('NgxRxdbService');
const IMPORTED_FLAG = '_ngx_rxdb_imported';

/**
 * Service for managing a RxDB database instance.
 */
@Injectable()
export class NgxRxdbService {
  private dbInstance: RxDatabase | null = null;

  private static mergeConfig(config: NgxRxdbConfig): NgxRxdbConfig {
    return merge(RXDB_DEFAULT_CONFIG, config);
  }

  static getCouchAuthProxyHeaders(
    userName = '',
    roles: string[] = [],
    token = ''
  ): { [h: string]: string } {
    return {
      'X-Auth-CouchDB-UserName': userName,
      'X-Auth-CouchDB-Roles': roles.join(','),
      'X-Auth-CouchDB-Token': token,
    };
  }

  get db(): RxDatabase {
    return this.dbInstance!;
  }

  get collections(): CollectionsOfDatabase {
    return this.db!.collections;
  }

  constructor(@Inject(LOCAL_STORAGE) private localStorage: Storage) {
    this._imported = this.localStorage[IMPORTED_FLAG];
  }

  async destroyDb() {
    try {
      await this.dbInstance!.remove();
      await this.dbInstance!.destroy();
      this.dbInstance = null;
      log(`database destroy`);
    } catch {
      log(`database destroy error`);
    }
  }

  /**
   * Runs via APP_INITIALIZER in app.module.ts
   * to ensure the database exists before the angular-app starts up
   * @param config
   */
  async initDb(config: NgxRxdbConfig) {
    try {
      const dbConfig = NgxRxdbService.mergeConfig(config);
      await loadRxDBPlugins();
      this.dbInstance = await createRxDatabase(dbConfig).catch(e => {
        throw new NgxRxdbError(e.message ?? e);
      });
      log(`created database ${this.db.name}`);

      if (dbConfig.multiInstance) {
        // await this.dbInstance.waitForLeadership(); // TODO: clean-up
        // debug(`database isLeader now`);
      }

      // optional: can create collections from root config
      if (!isEmpty(dbConfig?.options?.schemas)) {
        const bulk = await this.initCollections(dbConfig!.options!.schemas!);
        log(`created ${Object.keys(bulk).length} collections bulk: ${Object.keys(bulk)}`);
      }

      // optional: can import dump from remote file
      if (dbConfig.options?.dumpPath) {
        await this.importDbDump(dbConfig.options.dumpPath);
      }
    } catch (error: any) {
      throw new NgxRxdbError(error.message ?? error);
    }
  }

  /**
   * uses bulk `addCollections` method at the end of array
   * @param colConfigs
   */
  async initCollections(colConfigs: Record<string, NgxRxdbCollectionConfig>) {
    try {
      const colCreators = await this.prepareCollections(colConfigs);
      return await this.dbInstance!.addCollections(colCreators);
    } catch (error: any) {
      throw new NgxRxdbError(error.message ?? error);
    }
  }

  async initCollection(colConfig: NgxRxdbCollectionConfig) {
    let col = this.getCollection(colConfig!.name!);
    try {
      if (col) {
        // delete  data in collection if exists
        if (colConfig.options?.recreate) {
          await col.remove();
        }
        log('collection', col.name, 'exists, skip create');
        return col;
      }

      const colCreator = await this.prepareCollections({
        [colConfig!.name!]: colConfig,
      });
      const res = await this.dbInstance!.addCollections(colCreator);
      col = res[colConfig!.name!];
      log(`created collection "${col.name}"`);

      if (colConfig.options?.initialDocs) {
        await this.importColDump(col, colConfig.options.initialDocs);
      }

      return col;
    } catch (error: any) {
      throw new NgxRxdbError(error.message ?? error);
    }
  }

  getCollection(name: string): RxCollection | null {
    const collection = this.db?.[name];
    if (isRxCollection(collection)) {
      return collection;
    } else {
      log(`returned [false] for RxDB.isRxCollection(${name})`);
      return null;
    }
  }

  syncCollection(
    col: RxCollection,
    remoteDbName = 'db',
    customHeaders?: Record<string, string>
  ): RxReplicationState {
    let rState: RxReplicationState = {} as RxReplicationState;

    if (!col.options?.syncOptions?.remote) {
      return rState;
    }
    const syncOptions = (col.options as NgxRxdbCollectionConfig['options'])!.syncOptions!;
    syncOptions.remote = syncOptions.remote.concat('/', remoteDbName);
    // merge options
    syncOptions.options = merge(
      this.db.pouchSettings.ajax,
      { back_off_function: DEFAULT_BACKOFF_FN },
      syncOptions.options as any
    );
    // append auth headers
    if (customHeaders) {
      (syncOptions.options as any).headers = merge(
        (syncOptions.options as any).headers,
        customHeaders
      );
    }
    // set filtered sync
    if (syncOptions.queryObj) {
      syncOptions.query = col.find(syncOptions.queryObj);
    }
    try {
      rState = col.sync(syncOptions);
    } catch (error) {
      log('syncCollection error', error);
    }
    return rState;
  }

  syncAllCollections(
    remoteDbName = 'db',
    customHeaders?: { [h: string]: string }
  ): RxReplicationState[] {
    if (isEmpty(this.collections)) {
      throw new NgxRxdbError('collections must be initialized before importing dump');
    }
    const replicationStates: RxReplicationState[] = [];
    forEach(this.collections, col => {
      if (!col.options?.syncOptions?.remote) {
        return;
      }
      const sync = this.syncCollection(col, remoteDbName, customHeaders)!;
      replicationStates.push(sync);
    });
    log('syncAllCollections = ', replicationStates);
    return replicationStates;
  }

  /**
   * imports pouchdb dump to the database, must be used only after db init
   * @param dumpPath
   */
  async importDbDump(dumpPath: string) {
    try {
      const dump = await this.prepareDbDump(dumpPath);
      // import only new dump
      if (!this._imported || this._imported !== dump.timestamp) {
        await this.db.importDump(dump);
        this._imported = dump.timestamp;
        log(`imported dump for db "${this.db.name}"`);
      }
    } catch (error: any) {
      if (error.status !== 409) {
        throw new NgxRxdbError(error.message ?? error);
      } else {
        // impoted but were conflicts with old docs - mark as imported
        this._imported = Date.now(); // dump.timestamp;
      }
    }
  }

  async importColDump(col: RxCollection, initialDocs: any[]) {
    if (initialDocs.length) {
      const info = await col.info();
      const count = await col.countAllDocuments();
      if (!count && info.update_seq <= 1) {
        log(`collection "${col.name}" has "${parseInt(count, 0)}" docs`);
        // preload data into collection
        const dump = new NgxRxdbCollectionDump({
          name: col.name,
          schemaHash: col.schema.hash,
          docs: initialDocs,
        });
        await col.importDump(dump);
        log(`imported ${initialDocs.length} docs for collection "${col.name}"`);
      }
    }
  }

  private get _imported() {
    return this.localStorage[IMPORTED_FLAG];
  }
  private set _imported(v: number) {
    this.localStorage[IMPORTED_FLAG] = v;
  }

  private async prepareCollections(
    colConfigs: Record<string, NgxRxdbCollectionConfig>
  ): Promise<Record<string, RxCollectionCreator>> {
    try {
      const colCreators = {};
      const configs = Object.values(colConfigs);
      for (const config of configs) {
        // optionally fetch schema from remote url
        if (!config.schema && !!config.options?.schemaUrl) {
          config.schema = await NgxRxdbCollectionCreator.fetchSchema(
            config.options.schemaUrl
          );
        }
        checkSchema(config.schema!);
        colCreators[config.name!] = new NgxRxdbCollectionCreator(config);
      }
      return colCreators;
    } catch (error: any) {
      throw new NgxRxdbError(error.message ?? error);
    }
  }

  /**
   * change schemaHashes from dump to existing schema hashes
   * @param dumpPath
   */
  private async prepareDbDump(dumpPath: string): Promise<NgxRxdbDump> {
    // fetch dump json
    const dumpObj = await (await fetch(dumpPath)).json();
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
