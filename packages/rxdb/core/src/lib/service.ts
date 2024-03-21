import {
  RxCollectionExtended as RxCollection,
  RxCollectionCreatorExtended,
} from '@ngx-odm/rxdb/config';
import { prepareCollections } from '@ngx-odm/rxdb/prepare';
import { NgxRxdbUtils } from '@ngx-odm/rxdb/utils';
import {
  CollectionsOfDatabase,
  RxDatabase,
  RxDatabaseCreator,
  createRxDatabase,
} from 'rxdb';
import { loadRxDBPlugins } from './plugin.loader';

const { logger } = NgxRxdbUtils;

/**
 * Service for managing a RxDB database instance.
 */
export class RxDBService {
  private dbInstance!: RxDatabase;
  private options!: RxDatabaseCreator;

  get db(): RxDatabase {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.dbInstance!;
  }

  get dbOptions(): RxDatabaseCreator {
    return this.options;
  }

  get collections(): { [name: string]: RxCollection } {
    return this.db.collections as { [name: string]: RxCollection };
  }

  async destroyDb() {
    try {
      await this.db.remove();
      await this.db.destroy();
      (this.dbInstance as unknown) = null;
      logger.log(`database destroy`);
    } catch {
      logger.log(`database destroy error`);
    }
  }

  /**
   * Runs via APP_INITIALIZER in app.module.ts
   * to ensure the database exists before the angular-app starts up
   * @param config
   */
  async initDb(config: RxDatabaseCreator): Promise<void> {
    if (this.dbInstance) {
      return;
    }
    try {
      await loadRxDBPlugins(config.options?.plugins);
      this.dbInstance = await createRxDatabase(config);
      this.options = config;
      logger.log(
        `created database "${this.db.name}" with config "${JSON.stringify(config)}"`
      );

      // optional: can create collections from root config
      if (config?.options?.schemas) {
        const bulk = await this.initCollections(config.options.schemas);
        logger.log(
          `created ${Object.keys(bulk).length} collections bulk: ${Object.keys(bulk)}`
        );
      }
    } catch (error) {
      logger.log('Error initializing the database:', error);
      throw error;
    }
  }

  /**
   * uses bulk `addCollections` method at the end of array
   * @param colConfigs
   */
  async initCollections(colConfigs: {
    [name: string]: RxCollectionCreatorExtended;
  }): Promise<CollectionsOfDatabase> {
    // eslint-disable-next-line no-useless-catch
    try {
      const colCreators = await prepareCollections(colConfigs);
      return await this.db.addCollections(colCreators);
    } catch (error) {
      logger.log('Error initializing collection(s)', error);
      throw error;
    }
  }
}
