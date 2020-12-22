/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  PouchDBInstance,
  PouchSettings,
  RxCollectionCreator,
  RxDumpCollectionAny,
  RxDumpDatabaseAny,
  RxJsonSchema,
} from 'rxdb';
import { AnyFn, NgxRxdbCollectionConfig } from './rxdb.interface';

export async function infoFn() {
  return await (this.pouch as PouchDBInstance).info();
}

export async function countAllDocumentsFn(): Promise<number> {
  const res = await (this.pouch as PouchDBInstance).allDocs({
    include_docs: false,
    attachments: false,
    deleted: 'ok',
    startkey: '_design\uffff',
  });
  return res.rows.length;
}

export const DEFAULT_INSTANCE_METHODS: { [key: string]: AnyFn } = {};
export const DEFAULT_COLLECTION_METHODS: { [key: string]: AnyFn } = {
  info: infoFn,
  countAllDocuments: countAllDocumentsFn,
};

// @dynamic
export class NgxRxdbCollectionCreator implements RxCollectionCreator {
  name: string;
  schema: RxJsonSchema;
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

export class NgxRxdbDump implements RxDumpDatabaseAny<any> {
  name = 'ngx-rxdb-dump';
  instanceToken: string;
  timestamp: number;
  encrypted = false;
  passwordHash = null;
  collections: any;

  constructor(data: Partial<NgxRxdbDump>) {
    Object.assign(this, data);
  }
}
export class NgxRxdbCollectionDump<T> implements RxDumpCollectionAny<T> {
  encrypted = false;
  passwordHash = null;
  schemaHash: string;
  name: string;
  docs: T[];

  constructor(data: Partial<RxDumpCollectionAny<T>>) {
    Object.assign(this, data);
  }
}
