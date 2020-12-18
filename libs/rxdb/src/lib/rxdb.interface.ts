// tslint:disable: interface-over-type-literal
import {
  MangoQuery,
  RxCollectionCreator,
  RxDatabaseCreator,
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

export interface NgxRxdbDump {
  name: string;
  instanceToken?: string;
  encrypted?: boolean;
  passwordHash?: string;
  collections: { [key: string]: any };
  timestamp: number;
}

export type AnyValue =
  | undefined
  | null
  | boolean
  | string
  | number
  | object
  | Date
  | any[];
export type AnyObject = { [key: string]: AnyValue };
