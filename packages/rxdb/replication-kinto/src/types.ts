/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Collection, CollectionSyncOptions } from 'kinto';
import type { PaginationResult, PaginatedParams } from 'kinto/lib/http/base';
import type {
  ReplicationOptions,
  ReplicationPullOptions,
  ReplicationPushOptions,
} from 'rxdb';
import { Merge, SetRequired } from 'type-fest';

/**
 * Synchronization strategies extracted from {@link Collection.sync}
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
export type KintoCollectionSyncOptions = CollectionSyncOptions & {
  exclude?: any[];
  strategy: KintoReplicationStrategy;
  timeout?: number;
  heartbeat?: number;
};
export type KintoCheckpointType = { last_modified: string | null | undefined };
export type KintoListParams = PaginatedParams;
export type KintoListResponse<T = any> = SetRequired<Partial<PaginationResult<T>>, 'data'>;

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
