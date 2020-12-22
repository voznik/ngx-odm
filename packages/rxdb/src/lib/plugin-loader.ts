import * as PouchdbAdapterHttp from 'pouchdb-adapter-http';
import * as PouchdbAdapterIdb from 'pouchdb-adapter-idb';
import { RxDBAdapterCheckPlugin } from 'rxdb/plugins/adapter-check';
import { addRxPlugin } from 'rxdb/plugins/core';
import { RxDBJsonDumpPlugin } from 'rxdb/plugins/json-dump';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import { RxDBMigrationPlugin } from 'rxdb/plugins/migration';
import { RxDBNoValidatePlugin } from 'rxdb/plugins/no-validate';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { RxDBReplicationPlugin } from 'rxdb/plugins/replication';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { isDevMode, isTestMode, logFn } from './utils';

export async function loadRxDBPlugins(): Promise<void> {
  addRxPlugin(RxDBReplicationPlugin);
  // http-adapter is always needed for replication with the node-server
  addRxPlugin(PouchdbAdapterHttp);
  /** default indexed-db adapter */
  addRxPlugin(PouchdbAdapterIdb);
  // plugins
  addRxPlugin(RxDBLeaderElectionPlugin);
  addRxPlugin(RxDBQueryBuilderPlugin);
  addRxPlugin(RxDBJsonDumpPlugin);
  addRxPlugin(RxDBAdapterCheckPlugin);
  addRxPlugin(RxDBMigrationPlugin);
  addRxPlugin(RxDBUpdatePlugin);

  /** * to reduce the build-size, we use some plugins in dev-mode only */
  if (isDevMode()) {
    logFn('load dev plugins');
    await Promise.all([
      // add dev-mode plugin
      // which does many checks and add full error-messages
      import('rxdb/plugins/dev-mode').then(module => addRxPlugin(module)),
      // we use the schema-validation only in dev-mode
      // this validates each document if it is matching the jsonschema
      import('rxdb/plugins/validate').then(module => addRxPlugin(module)),
    ]);
  } else if (isTestMode()) {
    await import('pouchdb-adapter-memory').then(module => addRxPlugin(module));
  } else {
    // in production we use the no-validate module instead of the schema-validation
    // to reduce the build-size
    addRxPlugin(RxDBNoValidatePlugin);
  }
}
