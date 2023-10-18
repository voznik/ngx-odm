/* eslint-disable @typescript-eslint/ban-types */
import type { NgxRxdbCollectionConfig } from '@ngx-odm/rxdb/config';
import type { KeyFunctionMap, PouchSettings, RxCollectionCreator } from 'rxdb/plugins/core';
import { RxJsonSchema } from 'rxdb/plugins/core';

async function infoFn(this: {
  pouch: PouchDB.Database;
}): Promise<PouchDB.Core.DatabaseInfo> {
  return await this.pouch.info();
}

async function countAllDocumentsFn(this: { pouch: PouchDB.Database }): Promise<number> {
  const res = await this.pouch.allDocs({
    include_docs: false,
    attachments: false,
    // deleted: 'ok',
    startkey: '_design\uffff', // Omit design doc
  });
  return res.total_rows - 1; // Omit design doc
}

async function getIndexesFn(this: {
  pouch: PouchDB.Database;
}): Promise<PouchDB.Find.GetIndexesResponse<{}>> {
  const res = await this.pouch.getIndexes();
  return res;
}

export type NgxRxdbCollectionStaticMethods = KeyFunctionMap & {
  info(): Promise<PouchDB.Core.DatabaseInfo>;
  countAllDocuments(): Promise<number>;
  getIndexes(): Promise<PouchDB.Find.GetIndexesResponse<{}>>;
};

const DEFAULT_INSTANCE_METHODS: Record<string, Function> = {};
const DEFAULT_COLLECTION_METHODS: NgxRxdbCollectionStaticMethods = {
  info: infoFn,
  countAllDocuments: countAllDocumentsFn,
  getIndexes: getIndexesFn,
};

/**
 * A class that implements the RxCollectionCreator interface and represents a collection creator for NgxRxdb.
 * It defines the properties and methods required to create a new RxCollection instance.
 */
export class NgxRxdbCollectionCreator implements RxCollectionCreator {
  name!: string;
  schema!: RxJsonSchema;
  pouchSettings?: NgxRxdbCollectionConfig['pouchSettings'];
  migrationStrategies?: NgxRxdbCollectionConfig['migrationStrategies'];
  statics?: NgxRxdbCollectionStaticMethods;
  methods?: NgxRxdbCollectionConfig['methods'];
  attachments?: NgxRxdbCollectionConfig['attachments'];
  options?: NgxRxdbCollectionConfig['options'];
  autoMigrate?: boolean; // (optional)
  cacheReplacementPolicy?: NgxRxdbCollectionConfig['cacheReplacementPolicy']; // (optional) custoom cache replacement policy

  /** @internal */
  constructor(config: NgxRxdbCollectionConfig, pouchSettings?: PouchSettings) {
    Object.assign(this, {
      ...config,
      pouchSettings: { ...pouchSettings, ...config.pouchSettings },
      methods: { ...DEFAULT_INSTANCE_METHODS, ...config.methods },
      statics: { ...DEFAULT_COLLECTION_METHODS, ...config.statics },
    });
  }

  /** @internal */
  static async fetchSchema(schemaUrl: string): Promise<RxJsonSchema> {
    return await (await fetch(schemaUrl)).json();
  }
}
