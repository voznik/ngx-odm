import { Injectable } from '@angular/core';
import {
  NgxRxdbCollectionConfig,
  NgxRxdbConfig,
  RXDB_DEFAULT_CONFIG,
} from '@ngx-odm/rxdb/config';
import { clone, logFn, merge } from '@ngx-odm/rxdb/utils';
import {
  CollectionsOfDatabase,
  RxCollection,
  RxCollectionCreator,
  RxDatabase,
  RxDatabaseCreator,
  createRxDatabase,
  isRxCollection,
} from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';
import { fetchSchema } from './rxdb-fetch-schema.plugin';
import { loadRxDBPlugins } from './rxdb-plugin.loader';

const log = logFn('NgxRxdbService');

/**
 * Service for managing a RxDB database instance.
 */
@Injectable()
export class NgxRxdbService {
  private dbInstance!: RxDatabase;

  get db(): RxDatabase {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.dbInstance!;
  }

  get collections(): CollectionsOfDatabase {
    return this.db.collections;
  }

  async destroyDb() {
    try {
      await this.db.remove();
      await this.db.destroy();
      (this.dbInstance as unknown) = null;
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
      const dbConfig: RxDatabaseCreator = config;
      dbConfig.storage =
        dbConfig.options?.storageType === 'dexie'
          ? getRxStorageDexie()
          : getRxStorageMemory();
      await loadRxDBPlugins();
      this.dbInstance = await createRxDatabase(dbConfig).catch(e => {
        throw new Error(e.message ?? e);
      });
      log(`created database ${this.db.name}`);

      if (dbConfig.multiInstance) {
        // await this.dbInstance.waitForLeadership(); // TODO: clean-up
        // debug(`database isLeader now`);
      }

      // optional: can create collections from root config
      if (dbConfig?.options?.schemas) {
        const bulk = await this.initCollections(dbConfig.options.schemas);
        log(`created ${Object.keys(bulk).length} collections bulk: ${Object.keys(bulk)}`);
      }
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * uses bulk `addCollections` method at the end of array
   * @param colConfigs
   */
  async initCollections(colConfigs: Record<string, NgxRxdbCollectionConfig>) {
    try {
      const colCreators = await this.prepareCollections(colConfigs);
      return await this.db.addCollections(colCreators);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async initCollection(colConfig: NgxRxdbCollectionConfig) {
    const { name, options } = colConfig;
    let col = this.getCollection(name);
    if (col) {
      // delete  data in collection if exists
      if (options?.recreate) {
        await col.remove();
      }
      log('collection', col.name, 'exists, skip create');
      return col;
    }

    try {
      const colCreator = await this.prepareCollections({
        [name]: colConfig,
      });
      const res = await this.db.addCollections(colCreator);
      col = res[name];
      log(`created collection "${name}"`);

      return col;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  getCollection(name: string): RxCollection | null {
    const collection = this.db.collections[name];
    if (isRxCollection(collection)) {
      return collection;
    } else {
      log(`returned [false] for RxDB.isRxCollection(${name})`);
      return null;
    }
  }

  /**
   * Prepares the collections by creating a record of collection creators based on the provided collection configurations.
   *
   * Optionally fetch schema from remote url if jsonschema is not provided.
   * @param colConfigs A record of collection configurations.
   * @returns A promise that resolves to a record of collection creators.
   */
  private async prepareCollections(
    colConfigs: Record<string, NgxRxdbCollectionConfig>
  ): Promise<Record<string, RxCollectionCreator>> {
    try {
      const colCreators: Record<string, RxCollectionCreator> = {};
      for (const name in colConfigs) {
        const config = colConfigs[name];
        // optionally fetch schema from remote url
        if (!config.schema && !!config.options?.schemaUrl) {
          config.schema = await fetchSchema(config.options.schemaUrl);
        }
        colCreators[config.name] = clone(config) as RxCollectionCreator;
      }
      return colCreators;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
