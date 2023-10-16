/* eslint-disable @typescript-eslint/ban-types */
import { NgxRxdbCollectionConfig } from '@ngx-odm/rxdb/config';
import {
  PouchDBInstance,
  PouchSettings,
  RxCollectionCreator,
  RxJsonSchema,
} from 'rxdb/plugins/core';

async function infoFn(this: { pouch: PouchDBInstance }): Promise<any> {
  return await this.pouch.info();
}

async function countAllDocumentsFn(this: { pouch: PouchDBInstance }): Promise<number> {
  const res = await this.pouch.allDocs({
    include_docs: false,
    attachments: false,
    deleted: 'ok',
    startkey: '_design\uffff',
  });
  return res.rows.length;
}

const DEFAULT_INSTANCE_METHODS: Record<string, Function> = {};
const DEFAULT_COLLECTION_METHODS: Record<string, Function> = {
  info: infoFn,
  countAllDocuments: countAllDocumentsFn,
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
  statics?: NgxRxdbCollectionConfig['statics'] & keyof typeof DEFAULT_COLLECTION_METHODS;
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
