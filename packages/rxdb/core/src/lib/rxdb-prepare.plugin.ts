/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-explicit-any */
import { RxCollectionCreatorExtended } from '@ngx-odm/rxdb/config';
import { NgxRxdbUtils } from '@ngx-odm/rxdb/utils';
import { compare } from 'compare-versions';
import type { Table as DexieTable } from 'dexie';
import type {
  CollectionsOfDatabase,
  InternalStoreDocType,
  RxCollection,
  RxCollectionCreator,
  RxDatabase,
  RxDatabaseCreator,
  RxDumpCollectionAny,
  RxDumpDatabaseAny,
  RxJsonSchema,
  RxPlugin,
  RxStorage,
  RxStorageInfoResult,
  RxStorageInstance,
} from 'rxdb';
import { getAllCollectionDocuments } from 'rxdb';
import { flatClone as clone } from 'rxdb/plugins/utils';

const RXDB_STORAGE_TOKEN_ID = 'storage-token|storageToken';
const IMPORTED_FLAG = '_ngx_rxdb_imported';

/**
 * @see https://stackoverflow.com/a/47180009/3443137
 */
const getDefaultFetch = () => {
  if (typeof window === 'object' && 'fetch' in window) {
    return window.fetch.bind(window);
  } else {
    return fetch;
  }
};

/**
 * Returns a fetch handler that contains the username and password
 * in the Authorization header
 * @param username
 * @param password
 */
export function getFetchWithAuthorizationBasic(username: string, password: string) {
  const fetch = getDefaultFetch();
  const ret = (url: string, options: Record<string, any>) => {
    options = clone(options);
    if (!options.headers) {
      options.headers = {};
    }
    const encoded = btoa(username.trim() + ':' + password.trim());
    options.headers['Authorization'] = 'Basic ' + encoded;
    return fetch(url, options);
  };
  return ret;
}

export const fetchSchema = async (
  schemaUrl: string
): Promise<RxJsonSchema<any> | undefined> => {
  let schema: RxJsonSchema<any> | undefined;
  try {
    const fetch = getDefaultFetch();
    const result = await fetch(schemaUrl);
    if (result.ok) {
      schema = await result.json();
    } else {
      throw new Error(
        `Failed to fetch schema from "${schemaUrl}", status: ${result.status}`
      );
    }
  } catch (error) {
    throw new Error(`Failed to fetch schema from "${schemaUrl}"`);
  }

  return schema;
};

/**
 * Prepares the collections by creating a record of collection creators based on the provided collection configurations.
 *
 * Optionally fetch schema from remote url if jsonschema is not provided.
 * @param colConfigs A record of collection configurations.
 * @returns A promise that resolves to a record of collection creators.
 */
export const prepareCollections = async (
  colConfigs: Record<string, RxCollectionCreatorExtended>
): Promise<Record<string, RxCollectionCreator>> => {
  try {
    const colCreators: Record<string, RxCollectionCreator> = {};
    for (const name in colConfigs) {
      const config = colConfigs[name];
      if (!config.schema && !!config.options?.schemaUrl) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        config.schema = (await fetchSchema(config.options.schemaUrl))!;
      }
      colCreators[config.name] = clone(config);
    }
    return colCreators;
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * change schemaHashes from dump to existing schema hashes
 * @param dumpPath
 * @param collections
 */
const prepareDbDump = async (
  dumpPath: string,
  collections: CollectionsOfDatabase
): Promise<RxDumpDatabaseAny<any>> => {
  let dumpObj: RxDumpDatabaseAny<any>;
  // fetch dump json
  const fetch = getDefaultFetch();
  const result = await fetch(dumpPath);
  if (result.ok) {
    dumpObj = await result.json();
  } else {
    throw new Error(`Failed to fetch db dump from "${dumpPath}", status: ${result.status}`);
  }
  if (!collections || !Object.keys(collections).length) {
    throw new Error('collections must be initialized before importing');
  }
  for (const dc of dumpObj.collections) {
    const col = collections[dc.name];
    if (col) {
      dc.schemaHash = col.schema['_hash'];
    } else {
      throw new Error('no such collection as provided in dump');
    }
  }
  return dumpObj;
};

/**
 * this is a hack to solve RSDB error `DM5: 'Cannot open database state with newer RxDB version. You have to migrate your database state first. See see https://rxdb.info/migration-storage.html'`
 *
 * Error is produced by rxdb & described at https://github.com/pubkey/rxdb/blob/master/src/plugins/dev-mode/error-messages.ts#L131
 *
 * Correct url to docs - https://rxdb.info/storage-migration.html
 *
 * the problem is that rxdb won't start because special field is missing in internal storage document data
 * AND ... pay attention to the sentence: `NOTICE: The storage migration plugin is part of RxDB premium. It is not part of the default RxDB module.`
 *
 * f@@@ck... why `Opening an older RxDB database state with a new major version should throw an error`
 * @param storage
 * @param storageInstance
 * @param rxdbVersion
 */
const migrateStorage = async (
  storage: RxStorage<any, any>,
  storageInstance: RxStorageInstance<any, any, any>,
  rxdbVersion: string
) => {
  let storageData: InternalStoreDocType['data'] = {};
  if (storage.name !== 'dexie') {
    return;
  }
  const dexieTable: DexieTable = (await storageInstance.internals)?.dexieTable;
  storageData = (await dexieTable.get(RXDB_STORAGE_TOKEN_ID))?.data;
  if (!storageData?.rxdbVersion || compare(rxdbVersion, storageData.rxdbVersion, '>')) {
    try {
      await dexieTable.update(RXDB_STORAGE_TOKEN_ID, {
        data: {
          ...storageData,
          rxdbVersion,
        },
      });
      NgxRxdbUtils.logger.log('prepare-plugin: migrated internal storage to', rxdbVersion);
    } catch (error) {
      throw new Error('prepare-plugin: unable to migrate internal storage');
    }
  }
  return;
};

/**
 * imports db dump from remote file to the database if provided
 * must be used only after db init
 */
const afterCreateRxDatabase = async ({
  database: db,
  creator,
}: {
  database: RxDatabase;
  creator: RxDatabaseCreator<any, any>;
}) => {
  NgxRxdbUtils.logger.log('prepare-plugin: hook:createRxDatabase:after');

  const { storage, internalStore: storageInstance, rxdbVersion } = db;
  await migrateStorage(storage, storageInstance, rxdbVersion); // TODO: remove or improve this hack

  if (!creator.options?.dumpPath || db._imported) {
    return;
  }

  try {
    const dump = await prepareDbDump(creator.options.dumpPath, db.collections);
    await db.importJSON(dump);
    (db as any)._imported = Date.now();
    NgxRxdbUtils.logger.log(`prepare-plugin: imported dump for db "${db.name}"`);
  } catch (error) {
    NgxRxdbUtils.logger.log('prepare-plugin: imported dump error', error);
    // impoted but possible conflicts - mark as imported
    (db as any)._imported = Date.now();
  }
};

/**
 * preload data into collection if provided
 */
const afterCreateRxCollection = async ({
  collection: col,
  creator,
}: {
  collection: RxCollection;
  creator: RxCollectionCreator;
}) => {
  const meta = await (col as any).getMetadata();
  NgxRxdbUtils.logger.log('prepare-plugin: hook:createRxCollection:after', meta);
  const initialDocs = creator.options?.initialDocs || [];
  const imported = (col.database as any)._imported;
  const { totalCount: count } = await col.storageInstance.info().catch(e => {
    return { totalCount: 0 } as RxStorageInfoResult;
  });
  if (!initialDocs.length) {
    return;
  }
  if (count || imported) {
    if (!creator.options?.recreate || creator.options?.replication) {
      return;
    } else {
      NgxRxdbUtils.logger.log(
        `prepare-plugin: collection "${col.name}" already has ${count} docs (including _deleted), but recreate option is set`
      );
      // await col.remove();
    }
  }
  const schemaHash = await col.schema.hash;
  const dump: RxDumpCollectionAny<any> = {
    name: col.name,
    schemaHash,
    docs: initialDocs,
  };
  try {
    await col.importJSON(dump);
    (col.database as any)._imported = Date.now();
    NgxRxdbUtils.logger.log(
      `prepare-plugin: imported ${initialDocs.length} docs for collection "${col.name}"`
    );
  } catch (error) {
    NgxRxdbUtils.logger.log('prepare-plugin: imported dump error', error);
  }
};

export const RxDBPreparePlugin: RxPlugin = {
  name: 'prepare-plugin',
  rxdb: true,
  prototypes: {
    RxDatabase: (proto: RxDatabase) => {
      (proto as any).fetchSchema = fetchSchema;
      // create proxy to get & set value from localstorage
      Object.defineProperty(proto, '_imported', {
        enumerable: false,
        get(): number | null {
          if (this.storage.name !== 'dexie') {
            return null;
          }
          const imported = localStorage.getItem(IMPORTED_FLAG);
          return imported ? parseInt(imported) : null;
        },
        set(value) {
          if (this.storage.name !== 'dexie') {
            return;
          }
          localStorage.setItem(IMPORTED_FLAG, value);
        },
      });
    },
    RxCollection: (proto: RxCollection) => {
      (proto as any).getMetadata = async function (): Promise<{}> {
        const allCollectionMetaDocs = await getAllCollectionDocuments(
          this.database.storage.statics,
          this.database.internalStore
        );
        const { id, data, _meta, _rev } =
          allCollectionMetaDocs.filter(metaDoc => metaDoc.data.name === this.name)?.at(0) ||
          {};
        return {
          id,
          name: data?.name,
          ..._meta,
          lastModified: Math.floor(_meta!.lwt) || null,
          rev: _rev || null,
        };
      };
      (proto as any).saveMetadata = async function (metadata: {}) {
        // TODO:
        return Promise.resolve();
      };
    },
  },
  hooks: {
    createRxDatabase: {
      after: afterCreateRxDatabase,
    },
    createRxCollection: {
      after: afterCreateRxCollection,
    },
  },
};
