import { isDevMode, logFn } from '@ngx-odm/rxdb/utils';
import * as PouchdbAdapterHttp from 'pouchdb-adapter-http';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import * as PouchdbAdapterIdb from 'pouchdb-adapter-idb';
import { RxDBAdapterCheckPlugin } from 'rxdb/plugins/adapter-check';
import { addRxPlugin } from 'rxdb/plugins/core';
import { RxDBJsonDumpPlugin } from 'rxdb/plugins/json-dump';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import { RxDBLocalDocumentsPlugin } from 'rxdb/plugins/local-documents';
import { RxDBMigrationPlugin } from 'rxdb/plugins/migration';
import { RxDBNoValidatePlugin } from 'rxdb/plugins/no-validate';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { RxDBReplicationPlugin } from 'rxdb/plugins/replication';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { NgxRxdbError } from './rxdb-error.class';

const debug = logFn('NgxRxdb PluginLoader');

/**
 * Loads all the necessary RxDB plugins for the application to work.
 * @returns A Promise that resolves when all the plugins have been loaded.
 * @throws {NgxRxdbError} If there was an error loading the plugins.
 */
export async function loadRxDBPlugins(): Promise<void> {
  try {
    addRxPlugin(RxDBReplicationPlugin);
    // http-adapter is always needed for replication with the node-server
    addRxPlugin(PouchdbAdapterHttp);
    /** default indexed-db adapter */
    addRxPlugin(PouchdbAdapterIdb);
    // plugins
    addRxPlugin(RxDBLocalDocumentsPlugin);
    addRxPlugin(RxDBLeaderElectionPlugin);
    addRxPlugin(RxDBQueryBuilderPlugin);
    addRxPlugin(RxDBJsonDumpPlugin);
    addRxPlugin(RxDBAdapterCheckPlugin);
    addRxPlugin(RxDBMigrationPlugin);
    addRxPlugin(RxDBUpdatePlugin);

    /** * to reduce the build-size, we use some plugins in dev-mode only */
    if (isDevMode()) {
      debug('load dev plugins');
      await Promise.all([
        // add dev-mode plugin
        // which does many checks and add full error-messages
        import('rxdb/plugins/dev-mode').then(module => addRxPlugin(module)),
        // we use the schema-validation only in dev-mode
        // this validates each document if it is matching the jsonschema
        import('rxdb/plugins/validate').then(module => addRxPlugin(module)),
      ]);
    } else {
      // in production we use the no-validate module instead of the schema-validation
      // to reduce the build-size
      addRxPlugin(RxDBNoValidatePlugin);
    }
  } catch (error: any) {
    throw new NgxRxdbError(error.message ?? error);
  }
}
