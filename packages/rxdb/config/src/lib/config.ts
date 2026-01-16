// INFO: we NEED to keep `any` here. only Typescript complains, but type resolution for consumers does work
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NgxRxdbUtils } from '@ngx-odm/rxdb/utils';
import type {
  MangoQuery,
  RxCollection,
  RxCollectionCreator,
  RxDatabaseCreator,
  RxJsonSchema,
  RxPlugin,
} from 'rxdb';
import { RxReplicationState } from 'rxdb/plugins/replication';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';
import { Observable } from 'rxjs';
import type { Merge, SetOptional, SetRequired } from 'type-fest';

export interface RxCollectionCreatorOptions<T = any> {
  schemaUrl?: string;
  initialDocs?: T[];
  /** @deprecated */
  recreate?: boolean;
  useQueryParams?: boolean;
  replicationStateFactory?: (col: RxCollection<T>) => RxReplicationState<T, any> | null;
}

export type RxCollectionCreatorExtended<T = any> = Merge<
  RxCollectionCreator<T>,
  {
    schema: RxJsonSchema<T>;
    name: string;
    options?: RxCollectionCreatorOptions<T>;
  }
>;

export type RxCollectionExtended<T = any> = RxCollection<T> &
  RxCollectionWithMetadata &
  RxCollectionWiithQueryParams<T>;

export type RxCollectionWiithQueryParams<T = any> = {
  queryParamsInit?: (
    currentUrl$: Observable<string>,
    updateQueryParamsInLocationFn: (queryParams: MangoQueryParams) => Promise<any>
  ) => void;
  queryParams?: {
    $: Observable<MangoQuery<T>>;
    get(): MangoQuery<T>;
    set(query: MangoQuery<T>): void;
    patch(query: MangoQuery<T>): void;
  };
};

export type RxCollectionWithMetadata = {
  /** Get DB metadata */
  getMetadata: () => Promise<RxDbMetadata>;
};

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
 * RxCollection hooks names
 * @see https://rxdb.info/middleware.html
 */
export type RxCollectionHooks =
  | 'preInsert'
  | 'preSave'
  | 'preRemove'
  | 'postInsert'
  | 'postSave'
  | 'postRemove'
  | 'postCreate';

export type MangoQueryParams = {
  selector?: string | undefined;
  sort?: string | undefined;
  skip?: number | undefined;
  limit?: number | undefined;
};

/**
 * Custom options object for {@link RxDatabaseCreator}
 */
interface NgxRxdbConfigOptions {
  schemas?: Record<string, RxCollectionCreatorExtended>;
  storageType: 'dexie' | 'memory';
  storageOptions?: {};
  dumpPath?: string;
  useQueryParams?: boolean;
  plugins?: RxPlugin[];
}

type RxDatabaseCreatorPartialStorage = SetOptional<RxDatabaseCreator, 'storage'>;
/* prettier-ignore */
type RxDatabaseCreatorRequireOptions = SetRequired< RxDatabaseCreatorPartialStorage, 'options'>;
/* prettier-ignore */
export type RxDatabaseCreatorExtended = Merge< RxDatabaseCreatorRequireOptions, { options: NgxRxdbConfigOptions }>;

/**
 * Returns full configuration object for creating an RxDatabase instance.
 * @param config - Partial configuration options for the RxDatabase instance.
 */
export function getRxDatabaseCreator(config: RxDatabaseCreatorExtended): RxDatabaseCreator {
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

  if (NgxRxdbUtils.isDevMode()) {
    storage = wrappedValidateAjvStorage({
      storage,
    });
  }

  // (storage as Writable<RxStorage<any, any>, 'name'>).name = name;
  const dbConfig: RxDatabaseCreator = {
    name,
    storage,
    options,
    ...rest,
  };
  return dbConfig;
}

export const DEFAULT_BACKOFF_FN = (delay: number) => (delay === 0 ? 2000 : delay * 3);

export const DEFAULT_LOCAL_DOCUMENT_ID = 'local';
