import { MangoQuery, RxCollectionCreator, RxDatabaseCreator, SyncOptions } from 'rxdb';

export declare interface NgxRxdbCollectionConfig extends Partial<RxCollectionCreator> {
  schema?: RxCollectionCreator['schema'];
  options?: {
    syncOptions?: SyncOptions & { queryObj?: MangoQuery<any> };
    schemaUrl?: string;
    initialDocs?: AnyObject[];
    recreate?: boolean;
  };
}

export declare interface NgxRxdbConfig extends RxDatabaseCreator {
  options?: {
    schemas?: Record<string, NgxRxdbCollectionConfig>;
    dumpPath?: string;
  };
}
