/* eslint-disable @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-explicit-any */
import { logFn } from '@ngx-odm/rxdb/utils';
import type {
  CollectionsOfDatabase,
  RxCollection,
  RxCollectionCreator,
  RxDatabase,
  RxDumpCollectionAny,
  RxDumpDatabaseAny,
  RxJsonSchema,
  RxPlugin,
} from 'rxdb';
import { checkSchema } from 'rxdb/plugins/dev-mode';

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
  // const dumpWithHashes = new NgxRxdbDump(dumpObj);
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

export const RxDBFetchSchemaPlugin: RxPlugin = {
  name: 'fetch-schema',
  rxdb: true,
  prototypes: {
    RxDatabase: (proto: RxDatabase) => {
      (proto as any).fetchSchema = fetchSchema;
      (proto as any)._imported = undefined;
    },
  },
  hooks: {
    createRxDatabase: {
      /**
       * imports pouchdb dump from remote file to the database if provided
       * must be used only after db init
       */
      after: async ({ database: db, creator }) => {
        log('hook:createRxDatabase:after', db, creator);
        // || db._imported !== dump.timestamp // import only new dump
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
      },
    },
    preCreateRxSchema: {
      before: async (cc: any) => {
        log('hook:preCreateRxSchema:before', cc);
      },
      after: async (cc: any) => {
        log('hook:preCreateRxSchema:after', cc);
      },
    },
    preCreateRxCollection: {
      before: async (cc: RxCollectionCreator) => {
        log('hook:preCreateRxCollection:before', cc);
        // optionally fetch schema from remote url
        if (!cc.schema && !!cc.options?.schemaUrl) {
          cc.schema = await (cc as any).fetchSchema(cc.options.schemaUrl);
          checkSchema(cc.schema!);
        }
      },
    },
    createRxCollection: {
      /**
       * preload data into collection if provided
       */
      after: async ({ collection: col, creator }) => {
        const internals = await col.database.internalStore.internals;
        log('hook:createRxCollection:after', creator, internals);
        const initialDocs = creator.options?.initialDocs || [];
        let count = 0;
        count = await col
          .count()
          .exec()
          .catch(e => {
            console.error(e);
            return 0;
          });
        if (!initialDocs.length || count) {
          return;
        }
        const dump: RxDumpCollectionAny<any> = {
          name: col.name,
          schemaHash: col.schema.hash,
          docs: initialDocs,
        };
        try {
          await col.importJSON(dump);
          log(`imported ${initialDocs.length} docs for collection "${col.name}"`);
        } catch (error) {
          log('imported dump error', error);
        }
      },
    },
  },
};
