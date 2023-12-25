/* eslint-disable @typescript-eslint/ban-types */
import { InjectionToken } from '@angular/core';
import type {
  FilledMangoQuery,
  PreparedQuery,
  RxCollection,
  RxCollectionCreator,
  RxDatabaseCreator,
  RxJsonSchema,
} from 'rxdb';
import { RxReplicationState } from 'rxdb/plugins/replication';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';
import type { Merge, SetOptional, SetRequired } from 'type-fest';

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface RxCollectionCreatorOptions {
  schemaUrl?: string;
  initialDocs?: Record<string, any>[];
  recreate?: boolean;
  replicationStateFactory?: (col: RxCollection) => RxReplicationState<any, any> | null;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export type RxCollectionCreatorExtended<T = any> = Merge<
  RxCollectionCreator<T>,
  {
    schema: RxJsonSchema<any> | string;
    name: string;
    options?: RxCollectionCreatorOptions;
  }
>;

export type RxCollectionExtended<T = any> = Merge<
  RxCollection<T>,
  {
    /** Static empty query */
    defaultQuery: FilledMangoQuery<any>;
    /** Static empty query "prepared" (RxDb) */
    defaultPreparedQuery: PreparedQuery<any>;
    /** Get DB metadata */
    getMetadata: () => Promise<RxDbMetadata>;
  }
>;

export interface RxDbMetadata {
  id: string;
  collectionName: string;
  databaseName: string;
  storageName: string;
  last_modified: number;
  rev: number;
  isFirstTimeInstantiated: boolean;
}

/**
 * Instance of RxDatabaseCreator
 */
export const RXDB_CONFIG = new InjectionToken<RxDatabaseCreator>('RxDatabaseCreator');
/**
 * Instance of RxCollectionCreator
 */
/* prettier-ignore */
export const RXDB_CONFIG_COLLECTION = new InjectionToken<RxCollectionCreator>('RxCollectionCreator');

/**
 * Custom options object for {@link RxDatabaseCreator}
 */
interface NgxRxdbConfigOptions {
  schemas?: Record<string, RxCollectionCreatorExtended>;
  storageType: 'dexie' | 'memory';
  storageOptions?: {};
  dumpPath?: string;
}

type RxDatabaseCreatorPartialStorage = SetOptional<RxDatabaseCreator, 'storage'>;
/* prettier-ignore */
type RxDatabaseCreatorRequireOptions = SetRequired< RxDatabaseCreatorPartialStorage, 'options'>;
/* prettier-ignore */
type NgxRxdbConfig = Merge< RxDatabaseCreatorRequireOptions, { options: NgxRxdbConfigOptions }>;

/**
 * Returns full configuration object for creating an RxDatabase instance.
 * @param config - Partial configuration options for the RxDatabase instance.
 */
export function getRxDatabaseCreator(config: NgxRxdbConfig): RxDatabaseCreator {
  // eslint-disable-next-line prefer-const
  let { name, options, storage, ...rest } = config;
  if (!storage) {
    switch (options.storageType) {
      case 'dexie':
        storage = getRxStorageDexie(options.storageOptions);
        break;
      case 'memory':
        storage = getRxStorageMemory(options.storageOptions);
        break;
      default:
        storage = getRxStorageMemory(options.storageOptions);
        break;
    }
  }
  // (storage as Writable<RxStorage<any, any>, 'name'>).name = name;
  const dbConfig: RxDatabaseCreator = {
    name,
    storage,
    ...rest,
  };
  return dbConfig;
}

export const DEFAULT_BACKOFF_FN = (delay: number) => (delay === 0 ? 2000 : delay * 3);
