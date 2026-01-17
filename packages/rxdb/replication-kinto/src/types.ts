import type {
  ReplicationOptions,
  ReplicationPullOptions,
  ReplicationPushOptions,
} from 'rxdb';
import { Merge, SetRequired } from 'type-fest';

/**
 * Synchronization strategies extracted from Kinto
 *
 * Strategy only applies to outgoing conflicts. Incoming conflicts will still be reported in the conflicts array. See [resolving conflicts section](https://kintojs.readthedocs.io/en/latest/api/#resolving-conflicts-manually)
 *
 */
export enum KintoReplicationStrategy {
  /**
   * `Kinto.syncStrategy.CLIENT_WINS`: Client data will always be preserved.
   */
  CLIENT_WINS = 'CLIENT_WINS',
  /**
   * `Kinto.syncStrategy.SERVER_WINS`: Server data will always be preserved;
   */
  SERVER_WINS = 'SERVER_WINS',
  /**
   * `Kinto.syncStrategy.PULL_ONLY`: Server data will always be preserved and local data never pushed.
   */
  PULL_ONLY = 'PULL_ONLY',
  /**
   * `Kinto.syncStrategy.MANUAL` **(default)**: Conflicts are reflected in a conflicts array as a result, and need to be resolved manually;
   */
  MANUAL = 'MANUAL',
}

export type KintoCollectionSyncOptions = {
  headers?: Record<string, string>;
  retry?: number;
  ignoreBackoff?: boolean;
  bucket?: string | null;
  collection?: string | null;
  remote?: string | null;
  expectedTimestamp?: string | null;
  exclude?: any[];
  strategy?: KintoReplicationStrategy;
  timeout?: number;
  heartbeat?: number;
};
export type KintoCheckpointType = { last_modified: string | null | undefined };
export type KintoListParams = KintoPaginatedParams;
export type KintoListResponse<T = any> = SetRequired<
  Partial<KintoPaginationResult<T>>,
  'data'
>;

export type KintoReplicationOptions<RxDocType = any> = Merge<
  ReplicationOptions<RxDocType, any>,
  {
    kintoSyncOptions: KintoCollectionSyncOptions;
    fetch?: typeof fetch;
    pull?: Omit<
      ReplicationPullOptions<RxDocType, KintoCheckpointType>,
      'handler' | 'stream$'
    > & {
      heartbeat?: number;
    };
    push?: Omit<ReplicationPushOptions<RxDocType>, 'handler'>;
  }
>;

export interface KintoRequest {
  method?: string;
  path: string;
  headers: Record<string, unknown>;
  body?: any;
}
export interface KintInfoResponse {
  data: {
    last_modified: number;
  };
  permissions: any;
}
interface KintoConflictRecord {
  last_modified: number;
  id: string;
}
interface KintoConflictResponse {
  existing: KintoConflictRecord;
}
interface KintoResponseBody {
  data?: unknown;
  details?: KintoConflictResponse;
  code?: number;
  errno?: number;
  error?: string;
  message?: string;
  info?: string;
}
interface KintoErrorResponse {
  path: string;
  sent: KintoRequest;
  error: KintoResponseBody;
}
export interface KintoAggregateResponse {
  errors: KintoErrorResponse[];
  published: KintoResponseBody[];
  conflicts: any[];
  skipped: any[];
  last_modified: number | undefined;
}
export interface KintoBatchResponse {
  status: number;
  path: string;
  body: KintoResponseBody;
  headers: {
    [key: string]: string;
  };
}
export interface KintoOperationResponse<T = any> {
  status: number;
  path: string;
  body: {
    data: T;
  };
  headers: Record<string, string>;
}
export interface KintoPaginatedParams {
  sort?: string;
  filters?: Record<string, string | number>;
  limit?: number;
  pages?: number;
  since?: string;
  fields?: string[];
}
export interface KintoPaginationResult<T> {
  last_modified: string | null;
  data: T[];
  next?: (nextPage?: string | null) => Promise<KintoPaginationResult<T>>;
  hasNextPage?: boolean;
  totalRecords?: number;
}
