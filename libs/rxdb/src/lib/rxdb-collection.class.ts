// tslint:disable:ban-types
import {
  RxJsonSchema,
  RxCollectionCreator,
  PouchSettings,
  PouchDBInstance,
} from 'rxdb';
import { NgxRxdbCollectionConfig } from './rxdb.interface';

export function idLengthFn() {
  return this.primary.length;
}

export async function countAllDocumentsFn(): Promise<number> {
  return (await (this.pouch as PouchDBInstance).info()).doc_count;
}

export const DEFAULT_INSTANCE_METHODS: { [key: string]: Function } = {
  idLength: idLengthFn,
};
export const DEFAULT_COLLECTION_METHODS: { [key: string]: Function } = {
  countAllDocuments: countAllDocumentsFn,
};

// @dynamic
export class NgxRxdbCollectionCreator implements RxCollectionCreator {
  name: string;
  schema: RxJsonSchema;
  pouchSettings?: NgxRxdbCollectionConfig['pouchSettings'];
  migrationStrategies?: NgxRxdbCollectionConfig['migrationStrategies'];
  statics?: NgxRxdbCollectionConfig['statics'] &
    keyof typeof DEFAULT_COLLECTION_METHODS;
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
