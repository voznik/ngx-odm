import { isDevMode } from '@angular/core';
import { logFn } from '@ngx-odm/rxdb/utils';
import { addRxPlugin } from 'rxdb';
import { RxDBJsonDumpPlugin } from 'rxdb/plugins/json-dump';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import { RxDBLocalDocumentsPlugin } from 'rxdb/plugins/local-documents';
import { RxDBMigrationPlugin } from 'rxdb/plugins/migration';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
// import { wrappedValidateIsMyJsonValidStorage } from 'rxdb/plugins/validate-is-my-json-valid'; // TODO
// import { RxDBReplicationPlugin } from 'rxdb/plugins/replication';
import { RxDBFetchSchemaPlugin } from './rxdb-fetch-schema.plugin';

const log = logFn('PluginLoader');

/**
 * Loads all the necessary RxDB plugins for the application to work.
 * @returns A Promise that resolves when all the plugins have been loaded.
 * @throws  If there was an error loading the plugins.
 */
export async function loadRxDBPlugins(): Promise<void> {
  try {
    // plugins
    addRxPlugin(RxDBLocalDocumentsPlugin);
    addRxPlugin(RxDBLeaderElectionPlugin);
    addRxPlugin(RxDBQueryBuilderPlugin);
    addRxPlugin(RxDBJsonDumpPlugin);
    addRxPlugin(RxDBMigrationPlugin);
    addRxPlugin(RxDBUpdatePlugin);
    addRxPlugin(RxDBFetchSchemaPlugin);

    /** * to reduce the build-size, we use some plugins in dev-mode only */
    if (isDevMode()) {
      log('load dev plugins');
      // https://rxdb.info/dev-mode.html
      const { RxDBDevModePlugin } = await import('rxdb/plugins/dev-mode');
      addRxPlugin(RxDBDevModePlugin);
    }
  } catch (error) {
    throw new Error(error.message ?? error);
  }
}
