import { isDevMode } from '@angular/core';
import { NgxRxdbUtils } from '@ngx-odm/rxdb/utils';
import { addRxPlugin } from 'rxdb';
import { RxDBJsonDumpPlugin } from 'rxdb/plugins/json-dump';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import { RxDBLocalDocumentsPlugin } from 'rxdb/plugins/local-documents';
import { RxDBMigrationPlugin } from 'rxdb/plugins/migration-schema';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { RxDBPreparePlugin } from './rxdb-prepare.plugin';

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
    addRxPlugin(RxDBJsonDumpPlugin);
    addRxPlugin(RxDBMigrationPlugin);
    addRxPlugin(RxDBUpdatePlugin);
    addRxPlugin(RxDBPreparePlugin);

    /** * to reduce the build-size, we use some plugins in dev-mode only */
    if (isDevMode() && !NgxRxdbUtils.isTestEnvironment()) {
      // https://rxdb.info/dev-mode.html
      const { RxDBDevModePlugin } = await import('rxdb/plugins/dev-mode');
      addRxPlugin(RxDBDevModePlugin);
    }
    NgxRxdbUtils.logger.log('rxdb plugins loaded');
  } catch (error) {
    throw new Error(error.message ?? error);
  }
}
