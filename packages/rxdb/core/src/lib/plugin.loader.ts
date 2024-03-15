import { RxDBPreparePlugin } from '@ngx-odm/rxdb/prepare';
import { RxDBPUseQueryParamsPlugin } from '@ngx-odm/rxdb/query-params';
import { NgxRxdbUtils } from '@ngx-odm/rxdb/utils';
import { RxPlugin, addRxPlugin } from 'rxdb';
import { RxDBCleanupPlugin } from 'rxdb/plugins/cleanup';
import { RxDBJsonDumpPlugin } from 'rxdb/plugins/json-dump';
import { RxDBLocalDocumentsPlugin } from 'rxdb/plugins/local-documents';
import { RxDBMigrationPlugin } from 'rxdb/plugins/migration-schema';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';

const { logger } = NgxRxdbUtils;

/**
 * Loads all the necessary and additional RxDB plugins for the application to work.
 * @param plugins
 * @returns A Promise that resolves when all the plugins have been loaded.
 * @throws  If there was an error loading the plugins.
 */
export async function loadRxDBPlugins(plugins: RxPlugin[] = []): Promise<void> {
  try {
    // vendor
    addRxPlugin(RxDBLocalDocumentsPlugin);
    addRxPlugin(RxDBJsonDumpPlugin);
    addRxPlugin(RxDBMigrationPlugin);
    addRxPlugin(RxDBUpdatePlugin);
    addRxPlugin(RxDBCleanupPlugin);
    // custom
    addRxPlugin(RxDBPreparePlugin);
    addRxPlugin(RxDBPUseQueryParamsPlugin);
    // additional plugins
    for (const plugin of plugins) {
      addRxPlugin(plugin);
    }
    logger.log('rxdb plugins loaded');
  } catch (error) {
    throw new Error(error.message ?? error);
  }
}
