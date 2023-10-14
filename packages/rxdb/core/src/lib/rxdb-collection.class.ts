/* eslint-disable @typescript-eslint/ban-types */
/// reference
import {
  PouchDBInstance,
  PouchSettings,
  RxCollectionCreator,
  RxJsonSchema,
} from 'rxdb/plugins/core';
import { NgxRxdbCollectionConfig } from '@ngx-odm/rxdb/config';

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

// @dynamic
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

  constructor(config: NgxRxdbCollectionConfig, pouchSettings?: PouchSettings) {
    Object.assign(this, {
      ...config,
      pouchSettings: { ...pouchSettings, ...config.pouchSettings },
      methods: { ...DEFAULT_INSTANCE_METHODS, ...config.methods },
      statics: { ...DEFAULT_COLLECTION_METHODS, ...config.statics },
    });
  }

  static async fetchSchema(schemaUrl: string): Promise<RxJsonSchema> {
    return await (await fetch(schemaUrl)).json();
  }
}
