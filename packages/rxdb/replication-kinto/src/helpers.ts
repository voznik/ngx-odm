import { RxConflictHandlerInput, RxConflictHandlerOutput, deepEqual } from 'rxdb';
import { KintoCollectionSyncOptions, KintoReplicationStrategy } from './types';

export const DEFAULT_KINTO_SYNC_OPTIONS: KintoCollectionSyncOptions = {
  remote: '/',
  bucket: undefined,
  collection: undefined,
  headers: undefined,
  exclude: undefined,
  expectedTimestamp: undefined,
  timeout: undefined,
  heartbeat: 60000,
  strategy: KintoReplicationStrategy.CLIENT_WINS,
};

export const DEFAULT_REPLICATION_OPTIONS = {
  kintoSyncOptions: DEFAULT_KINTO_SYNC_OPTIONS,
  live: true,
  retryTime: 1000 * 5,
  waitForLeadership: true,
  autoStart: true,
};

export function conflictHandlerKinto({
  newDocumentState: local,
  realMasterState: remote,
}: RxConflictHandlerInput<any>): Promise<RxConflictHandlerOutput<any>> {
  if (deepEqual(local, remote)) {
    return Promise.resolve({
      isEqual: true,
    });
  }
  return Promise.resolve({
    isEqual: false,
    documentData: remote,
  });
}
