import { MangoQuery, RxCollectionCreator, RxDatabaseCreator, SyncOptions } from 'rxdb';

export interface NgxRxdbCollectionConfig extends Partial<RxCollectionCreator> {
  schema?: RxCollectionCreator['schema'];
  options?: {
    syncOptions?: SyncOptions & { queryObj?: MangoQuery<any> };
    schemaUrl?: string;
    initialDocs?: AnyObject[];
    recreate?: boolean;
  };
}

export interface NgxRxdbConfig extends RxDatabaseCreator {
  options?: {
    schemas?: Record<string, NgxRxdbCollectionConfig>;
    dumpPath?: string;
  };
}

export type AnyValue =
  | undefined
  | null
  | boolean
  | string
  | number
  | Date
  | Record<string, unknown>
  | Record<string, unknown>[];
// eslint-disable-next-line @typescript-eslint/ban-types
export type AnyObject<T = object> =
  | {
      [k in keyof T]?: AnyObject<T[k]>;
    }
  | AnyValue;
export type AnyFn = (...args: any[]) => unknown;
