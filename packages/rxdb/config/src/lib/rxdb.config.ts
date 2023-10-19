import { InjectionToken } from '@angular/core';
import type { MangoQuery, RxCollectionCreator, RxDatabaseCreator } from 'rxdb/plugins/core';
import type { SyncOptionsCouchDB } from 'rxdb/plugins/replication-couchdb';
// import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';

// import type { RxReplicationState } from 'rxdb/plugins/replication';

export interface NgxRxdbCollectionConfig extends Partial<RxCollectionCreator> {
  name: string;
  schema?: RxCollectionCreator['schema'];
  options?: {
    // syncOptions?: SyncOptionsCouchDB<any> & { queryObj?: MangoQuery<any> };
    syncOptions?: PouchDB.Configuration.RemoteDatabaseConfiguration & {
      queryObj?: MangoQuery<any>;
    };
    schemaUrl?: string;
    initialDocs?: Record<string, any>[];
    recreate?: boolean;
  };
  /** @deprecated */
  pouchSettings?: PouchDB.Configuration.DatabaseConfiguration;
}

export const RXDB_CONFIG = new InjectionToken<NgxRxdbConfig>('NgxRxdbConfig');
export const RXDB_CONFIG_COLLECTION = new InjectionToken<NgxRxdbCollectionConfig>(
  'NgxRxdbCollectionConfig'
);

export interface NgxRxdbConfig extends RxDatabaseCreator {
  options?: {
    storageType: 'dexie' | 'memory';
    schemas?: Record<string, NgxRxdbCollectionConfig>;
    dumpPath?: string;
  };
}

export const RXDB_DEFAULT_ADAPTER = 'idb';
export const RXDB_DEFAULT_CONFIG: NgxRxdbConfig = {
  name: 'ngx',
  storage: getRxStorageMemory(),
  multiInstance: true,
  ignoreDuplicate: false,
  /* pouchSettings: {
    skip_setup: true,
    ajax: {
      withCredentials: false,
      cache: false,
      timeout: 10000,
      headers: {},
    },
  }, */
};
export const DEFAULT_BACKOFF_FN = (delay: number) => (delay === 0 ? 2000 : delay * 3);
