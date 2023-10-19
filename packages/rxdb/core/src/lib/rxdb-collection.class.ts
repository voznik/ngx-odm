/* eslint-disable @typescript-eslint/ban-types */
import type { NgxRxdbCollectionConfig } from '@ngx-odm/rxdb/config';
import type {
  DefaultPreparedQuery,
  KeyFunctionMap,
  RxCollectionBase,
  RxCollectionCreator,
} from 'rxdb/plugins/core';
import { RxJsonSchema } from 'rxdb/plugins/core';
import { RxStorageDexieStatics } from 'rxdb/plugins/storage-dexie';

async function infoPouchFn(this: {
  pouch: PouchDB.Database;
}): Promise<PouchDB.Core.DatabaseInfo> {
  return await this.pouch.info();
}

async function infoFn(this: RxCollectionBase<any>): Promise<any> {
  const { attachments, refCount, removed } = await this.storageInstance.internals;
  return { attachments, refCount, removed };
}

async function getIndexesFn(this: {
  pouch: PouchDB.Database;
}): Promise<PouchDB.Find.GetIndexesResponse<{}>> {
  const res = await this.pouch.getIndexes();
  return res;
}

export type NgxRxdbCollectionStaticMethods = KeyFunctionMap & {
  info(): Promise<any>;
  getIndexes(): Promise<any>;
};

const DEFAULT_INSTANCE_METHODS: Record<string, Function> = {};
const DEFAULT_COLLECTION_METHODS: NgxRxdbCollectionStaticMethods = {
  info: infoFn,
  getIndexes: getIndexesFn,
};

/**
 * A class that implements the RxCollectionCreator interface and represents a collection creator for NgxRxdb.
 * It defines the properties and methods required to create a new RxCollection instance.
 */
export class NgxRxdbCollectionCreator implements RxCollectionCreator {
  name!: string;
  schema!: RxJsonSchema<any>;
  pouchSettings?: NgxRxdbCollectionConfig['pouchSettings'];
  migrationStrategies?: NgxRxdbCollectionConfig['migrationStrategies'];
  statics?: NgxRxdbCollectionStaticMethods;
  methods?: NgxRxdbCollectionConfig['methods'];
  attachments?: NgxRxdbCollectionConfig['attachments'];
  options?: NgxRxdbCollectionConfig['options'];
  autoMigrate?: boolean; // (optional)
  cacheReplacementPolicy?: NgxRxdbCollectionConfig['cacheReplacementPolicy']; // (optional) custoom cache replacement policy

  /** @internal */
  constructor(
    config: NgxRxdbCollectionConfig,
    pouchSettings?: NgxRxdbCollectionConfig['pouchSettings']
  ) {
    Object.assign(this, {
      ...config,
      pouchSettings: { ...pouchSettings, ...config.pouchSettings },
      methods: { ...DEFAULT_INSTANCE_METHODS, ...config.methods },
      statics: { ...DEFAULT_COLLECTION_METHODS, ...config.statics },
    });
  }

  /** @internal */
  static async fetchSchema(schemaUrl: string): Promise<RxJsonSchema<any> | undefined> {
    let schema: RxJsonSchema<any> | undefined;
    try {
      const result = await fetch(schemaUrl);
      if (result.ok) {
        schema = await result.json();
      } else {
        throw new Error(
          `Failed to fetch schema from "${schemaUrl}", status: ${result.status}`
        );
      }
    } catch (error: any) {
      throw new Error(`Failed to fetch schema from "${schemaUrl}"`);
    }

    return schema;
  }
}
