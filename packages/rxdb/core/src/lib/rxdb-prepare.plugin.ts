/* eslint-disable @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-explicit-any */
import { RxCollectionCreatorExtended } from '@ngx-odm/rxdb/config';
import { logFn } from '@ngx-odm/rxdb/utils';
import type {
  CollectionsOfDatabase,
  RxCollection,
  RxCollectionCreator,
  RxDatabase,
  RxDatabaseCreator,
  RxDumpCollectionAny,
  RxDumpDatabaseAny,
  RxJsonSchema,
  RxPlugin,
} from 'rxdb';

const log = logFn('RxDBFetchSchemaPlugin');

/**
 * @see https://stackoverflow.com/a/47180009/3443137
 */
export const getDefaultFetch = () => {
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
    options = Object.assign({}, options) as any;
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
      colCreators[config.name] = structuredClone(config) as RxCollectionCreator;
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
  log('hook:createRxDatabase:after', db, creator);
  if (!creator.options?.dumpPath || db._imported) {
    return;
  }
  try {
    const dump = await prepareDbDump(creator.options.dumpPath, db.collections);
    await db.importJSON(dump);
    (db as any)._imported = Date.now();
    log(`imported dump for db "${db.name}"`);
  } catch (error) {
    log('imported dump error', error);
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
  const internals = await col.storageInstance.internals;
  log('hook:createRxCollection:after', creator, internals);
  const initialDocs = creator.options?.initialDocs || [];
  let count = 0;
  const imported = (col.database as any)._imported;
  count = await col
    .count()
    .exec()
    .catch(e => {
      log('count error, return 0', e);
      return 0;
    });
  if (!initialDocs.length || count || imported) {
    return;
  }
  const dump: RxDumpCollectionAny<any> = {
    name: col.name,
    schemaHash: col.schema.hash,
    docs: initialDocs,
  };
  try {
    await col.importJSON(dump);
    (col.database as any)._imported = Date.now();
    log(`imported ${initialDocs.length} docs for collection "${col.name}"`);
  } catch (error) {
    log('imported dump error', error);
  }
};

export const RxDBPreparePlugin: RxPlugin = {
  name: 'fetch-schema',
  rxdb: true,
  prototypes: {
    RxDatabase: (proto: RxDatabase) => {
      (proto as any).fetchSchema = fetchSchema;
      // create proxy to get & set value from localstorage
      Object.defineProperty(proto, '_imported', {
        enumerable: false,
        get(): number | null {
          const imported = localStorage.getItem('_imported');
          return imported ? parseInt(imported) : null;
        },
        set(value) {
          localStorage.setItem('_imported', value);
        },
      });
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
