import { InjectionToken } from '@angular/core';
import type { MangoQuery, RxCollectionCreator, RxDatabaseCreator } from 'rxdb/plugins/core';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';
// import type { RxReplicationState } from 'rxdb/plugins/replication';

export interface NgxRxdbCollectionConfig extends Partial<RxCollectionCreator> {
  name: string;
  options?: {
    // syncOptions?: SyncOptionsCouchDB<any> & { queryObj?: MangoQuery<any> };
    // syncOptions?: PouchDB.Configuration.RemoteDatabaseConfiguration & { queryObj?: MangoQuery<any>; };
    syncOptions?: any;
    schemaUrl?: string;
    initialDocs?: Record<string, any>[];
    recreate?: boolean;
  };
  /** @deprecated */
  pouchSettings?: any; // PouchDB.Configuration.DatabaseConfiguration;
}

export const RXDB_CONFIG = new InjectionToken<NgxRxdbConfig>('NgxRxdbConfig');
export const RXDB_CONFIG_COLLECTION = new InjectionToken<NgxRxdbCollectionConfig>(
  'NgxRxdbCollectionConfig'
);

/**
 * Params to create a new database.
 * extends {@link RxDatabaseCreator}
 */
export interface NgxRxdbConfig extends RxDatabaseCreator {
  options?: {
    storageType: 'dexie' | 'memory';
    schemas?: Record<string, NgxRxdbCollectionConfig>;
    dumpPath?: string;
  };
}

export const RXDB_DEFAULT_STORAGE = 'memory';
export const RXDB_DEFAULT_CONFIG: NgxRxdbConfig = {
  name: 'ngx',
  instanceCreationOptions: {
    local: true,
  },
  storage: getRxStorageMemory(),
  multiInstance: true,
  ignoreDuplicate: false,
};
export const DEFAULT_BACKOFF_FN = (delay: number) => (delay === 0 ? 2000 : delay * 3);
