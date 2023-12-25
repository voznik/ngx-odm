/* eslint-disable @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-explicit-any */
import {
  RxCollectionExtended as RxCollection,
  RxCollectionCreatorExtended,
  RxDbMetadata,
} from '@ngx-odm/rxdb/config';
import { NgxRxdbUtils, getDefaultFetch } from '@ngx-odm/rxdb/utils';
import { compare } from 'compare-versions';
import type { Table as DexieTable } from 'dexie';
import type {
  CollectionsOfDatabase,
  InternalStoreDocType,
  RxCollectionCreator,
  RxDatabase,
  RxDatabaseCreator,
  RxDumpCollectionAny,
  RxDumpDatabaseAny,
  RxJsonSchema,
  RxPlugin,
  RxStorage,
  RxStorageInstance,
  RxCollection as _RxCollection,
} from 'rxdb';
import { getAllCollectionDocuments, isRxDatabaseFirstTimeInstantiated } from 'rxdb';
// TODO: use when stable
// import { AfterMigrateBatchHandlerInput, migrateStorage, } from 'rxdb/plugins/migration-storage';

const RXDB_STORAGE_TOKEN_ID = 'storage-token|storageToken';

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
      colCreators[config.name] = config as RxCollectionCreator;
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
const migrateStorageVersion = async (
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
  const isFirstTimeInstantiated = await isRxDatabaseFirstTimeInstantiated(db);
  NgxRxdbUtils.logger.log('prepare-plugin: hook:createRxDatabase:after');

  const { storage, internalStore: storageInstance, rxdbVersion } = db;
  await migrateStorageVersion(storage, storageInstance, rxdbVersion); // TODO: remove or improve this hack

  if (!creator.options?.dumpPath || !isFirstTimeInstantiated) {
    return;
  }

  try {
    const dump = await prepareDbDump(creator.options.dumpPath, db.collections);
    await db.importJSON(dump);
    NgxRxdbUtils.logger.log(`prepare-plugin: imported dump for db "${db.name}"`);
  } catch (error) {
    NgxRxdbUtils.logger.log('prepare-plugin: imported dump error', error);
  }
};

/**
 * Optionally fetch schema from remote url if jsonschema is not provided.
 * @param maybeSchema
 */
export const beforePreCreateRxSchema = async (maybeSchema: RxJsonSchema<any> | any) => {
  if (typeof maybeSchema === 'string') {
    const realSchema = await fetchSchema(maybeSchema);
    if (!realSchema) {
      throw new Error(`Failed to fetch schema from "${maybeSchema}"`);
    }
    maybeSchema = realSchema;
  }
};

/**
 * Preload data into collection if provided
 */
const beforeCreateRxCollection = async ({
  collection: col,
  creator,
}: {
  collection: RxCollection;
  creator: RxCollectionCreator;
}) => {
  NgxRxdbUtils.logger.log('prepare-plugin: hook:createRxCollection:before');
  const meta = await col.getMetadata();
  NgxRxdbUtils.logger.log('prepare-plugin: hook:createRxCollection:before', meta);
  const initialDocs = creator.options?.initialDocs || [];
  const initialCount = await countDocs();
  if (!initialDocs.length) {
    return;
  }
  if (initialCount || !meta.isFirstTimeInstantiated) {
    if (!creator.options?.recreate || creator.options?.replication) {
      return;
    } else {
      NgxRxdbUtils.logger.log(
        `prepare-plugin: collection "${col.name}" already has ${initialCount} docs (including _deleted), but recreate option is set`
      );
      // await removeAllDocs(); // TODO:
    }
  }
  const schemaHash = await col.schema.hash;
  const dump: RxDumpCollectionAny<any> = {
    name: col.name,
    schemaHash,
    docs: initialDocs,
  };
  try {
    const { success, error } = (await col.importJSON(dump)) as unknown as {
      success: any[];
      error: any[];
    };
    const count = await countDocs();
    NgxRxdbUtils.logger.log(
      `prepare-plugin: imported ${success.length} docs for collection "${col.name}", errors count ${error.length}, current docs count ${count}`
    );
    NgxRxdbUtils.logger.table(success);
  } catch (error) {
    NgxRxdbUtils.logger.log('prepare-plugin: imported dump error', error);
  }

  async function removeAllDocs() {
    await col.find().update({ $set: { _deleted: true } });
    await col.cleanup();
  }

  async function countDocs() {
    const { count } = await col.storageInstance
      .count(col.defaultPreparedQuery)
      .catch(e => ({ count: 0 }));
    return count;
  }
};

export const RxDBPreparePlugin: RxPlugin = {
  name: 'prepare-plugin',
  rxdb: true,
  prototypes: {
    RxDatabase: (proto: RxDatabase) => {
      Object.assign(proto, {
        fetchSchema,
      });
    },
    RxCollection: (proto: _RxCollection) => {
      const getMetadata = async function (this: RxCollection): Promise<RxDbMetadata> {
        const isFirstTimeInstantiated = await isRxDatabaseFirstTimeInstantiated(
          this.database
        );
        const allCollectionMetaDocs = await getAllCollectionDocuments(
          this.database.internalStore
        );
        const { id, data, _meta, _rev } =
          allCollectionMetaDocs.filter(metaDoc => metaDoc.data.name === this.name)!.at(0) ||
          {};
        return {
          id: id || this.name,
          databaseName: this.database.name,
          collectionName: data?.name || this.name,
          storageName: this.storageInstance.originalStorageInstance['storage'].name,
          last_modified: _meta?.lwt ? Math.floor(_meta?.lwt) : Date.now(),
          rev: _rev ? Number(_rev?.at(0)) : 1,
          isFirstTimeInstantiated,
        };
      };
      const defaultQuery = NgxRxdbUtils.getDefaultQuery();
      const defaultPreparedQuery = NgxRxdbUtils.getDefaultPreparedQuery();
      Object.assign(proto, {
        getMetadata,
        defaultQuery,
        defaultPreparedQuery,
      });
    },
  },
  hooks: {
    createRxDatabase: {
      after: afterCreateRxDatabase,
    },
    preCreateRxSchema: {
      before: beforePreCreateRxSchema,
    },
    createRxCollection: {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore // INFO: there's no way to fix type inheritance & rxdb typings
      before: beforeCreateRxCollection,
    },
  },
};
