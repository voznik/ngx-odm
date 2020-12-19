// tslint:disable: interface-over-type-literal
import {
  MangoQuery,
  RxCollectionCreator,
  RxDatabaseCreator,
  RxDumpDatabaseAny,
  SyncOptions,
} from 'rxdb';

export interface NgxRxdbCollectionConfig extends Partial<RxCollectionCreator> {
  schema?: RxCollectionCreator['schema'];
  options?: {
    syncOptions?: SyncOptions & { queryObj?: MangoQuery<any> };
    schemaUrl?: string;
    initialDocs?: any[];
    recreate?: boolean;
  };
}

export interface NgxRxdbConfig extends RxDatabaseCreator {
  options?: {
    schemas?: { [key: string]: NgxRxdbCollectionConfig };
    dumpPath?: string;
  };
}

export type AnyValue = undefined | null | boolean | string | number | object | Date | any[];
export type AnyObject = { [key: string]: AnyValue };
