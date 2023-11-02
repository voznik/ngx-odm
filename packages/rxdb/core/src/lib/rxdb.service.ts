import { Injectable } from '@angular/core';
import { RxCollectionCreatorExtended } from '@ngx-odm/rxdb/config';
import { NgxRxdbUtils } from '@ngx-odm/rxdb/utils';
import {
  CollectionsOfDatabase,
  RxCollection,
  RxDatabase,
  RxDatabaseCreator,
  createRxDatabase,
  isRxCollection,
} from 'rxdb';
import { loadRxDBPlugins } from './rxdb-plugin.loader';
import { prepareCollections } from './rxdb-prepare.plugin';

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
      NgxRxdbUtils.logger.log(`database destroy`);
    } catch {
      NgxRxdbUtils.logger.log(`database destroy error`);
    }
  }

  /**
   * Runs via APP_INITIALIZER in app.module.ts
   * to ensure the database exists before the angular-app starts up
   * @param config
   */
  async initDb(config: RxDatabaseCreator) {
    try {
      await loadRxDBPlugins();
      this.dbInstance = await createRxDatabase(config).catch(e => {
        throw new Error(e.message ?? e);
      });
      NgxRxdbUtils.logger.log(`created database ${this.db.name}`);

      // optional: can create collections from root config
      if (config?.options?.schemas) {
        const bulk = await this.initCollections(config.options.schemas);
        NgxRxdbUtils.logger.log(
          `created ${Object.keys(bulk).length} collections bulk: ${Object.keys(bulk)}`
        );
      }
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * uses bulk `addCollections` method at the end of array
   * @param colConfigs
   */
  async initCollections(
    colConfigs: Record<string, RxCollectionCreatorExtended>
  ): Promise<CollectionsOfDatabase> {
    try {
      const colCreators = await prepareCollections(colConfigs);
      return await this.db.addCollections(colCreators);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async initCollection(colConfig: RxCollectionCreatorExtended): Promise<RxCollection> {
    const { name, options } = colConfig;
    let col = this.collections[name];
    if (isRxCollection(col)) {
      // delete  data in collection if exists
      if (options?.recreate) {
        await col.remove();
      }
      NgxRxdbUtils.logger.log('collection', col.name, 'exists, skip create');
      return col;
    }

    try {
      const colCreator = await prepareCollections({
        [name]: colConfig,
      });
      const res = await this.db.addCollections(colCreator);
      col = res[name];
      NgxRxdbUtils.logger.log(`created collection "${name}"`);

      return col;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
