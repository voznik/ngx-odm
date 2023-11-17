/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-non-null-assertion */
import { NgxRxdbUtils } from '@ngx-odm/rxdb/utils';
import type {
  DocumentsWithCheckpoint,
  ReplicationPullOptions,
  ReplicationPushOptions,
  RxCollection,
} from 'rxdb';
import { addRxPlugin } from 'rxdb';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import { RxReplicationState, startReplicationOnLeaderShip } from 'rxdb/plugins/replication';
import {
  EMPTY,
  Observable,
  Subject,
  filter,
  first,
  from,
  interval,
  map,
  merge,
  of,
  switchMap,
  takeWhile,
} from 'rxjs';
import {
  DEFAULT_REPLICATION_OPTIONS,
  kintoCollectionFactory,
  mergeAggregatedResponse,
} from './helpers';
import {
  KintoAggregateResponse,
  KintoCheckpointType,
  KintoListResponse,
  KintoReplicationOptions,
} from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObject = Record<string, any>;

/**
 * The basic idea is to keep a local database up to date with the Kinto server:
 * - Remote changes are downloaded and applied on the local data.
 * - Local changes are uploaded using HTTP headers to control concurrency and overwrites.
 *
 * In short:
 * 1. Poll for remote changes using ?_since=<timestamp>
 * 2. Apply changes locally
 * 3. Send local creations
 * 4. Use concurrency control to send local updates and deletes
 *
 * Polling for remote changes
 *
 * Kinto supports range queries for timestamps. Combining them with the sort parameter allows to fetch changes in a particular order.
 *
 * Depending on the context (latest first, readonly, etc.), there are several strategies to poll the server for changes.
 * @param options
 */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
export function replicateKintoDB<RxDocType extends AnyObject>(
  options: KintoReplicationOptions
) {
  const {
    replicationIdentifier,
    kintoSyncOptions,
    fetch,
    pull,
    push,
    collection,
    retryTime: retry,
    live,
    autoStart,
    waitForLeadership,
  } = Object.assign(DEFAULT_REPLICATION_OPTIONS, options);
  addRxPlugin(RxDBLeaderElectionPlugin);

  const kintoCollection = kintoCollectionFactory(kintoSyncOptions, fetch);

  const pullStream$: Subject<DocumentsWithCheckpoint<RxDocType, KintoCheckpointType>> =
    new Subject();

  let _pullImplementation:
    | ReplicationPullOptions<RxDocType, KintoCheckpointType>
    | undefined;
  let _pushImplementation: ReplicationPushOptions<RxDocType> | undefined;
  let _pullHandlerResult$: Observable<
    DocumentsWithCheckpoint<RxDocType, KintoCheckpointType>
  > = EMPTY;
  let since: string | undefined;

  if (pull) {
    _pullImplementation = {
      async handler(lastPulledCheckpoint, batchSize) {
        since = lastPulledCheckpoint?.last_modified || undefined;
        const limit = batchSize || undefined;
        //  Assign function to pull remote changes.
        _pullHandlerResult$ = of(null).pipe(
          switchMap(() => kintoCollection.listRecords({ since, limit })),
          map(({ data: documents, last_modified, hasNextPage }: KintoListResponse<any>) => {
            // TODO: expect pagination with `next` if batchSize was provided
            since = last_modified!;
            return {
              documents,
              checkpoint: { last_modified },
            };
          })
        );

        return _pullHandlerResult$
          .pipe(first(), NgxRxdbUtils.retryWithBackoff(1, retry))
          .toPromise() as Promise<any>;
      },
      batchSize: pull?.batchSize,
      modifier: pull?.modifier,
      stream$: pullStream$.asObservable(),
    };
  }

  if (push) {
    _pushImplementation = {
      async handler(changes) {
        const { last_modified: lwt } = await collection.getMetadata();
        const {
          data: { last_modified },
        } = await kintoCollection.info();
        const outgoing = changes.map(({ newDocumentState: doc }) => doc);
        const results: KintoAggregateResponse = {
          errors: [],
          published: [],
          conflicts: [],
          skipped: [],
          last_modified,
        };

        // Perform 1st batch request with changes.
        const r = await kintoCollection.batch(outgoing);
        mergeAggregatedResponse(results, r);

        if (results.errors.length) {
          NgxRxdbUtils.logger.log(results.errors);
        }
        // Perform 2nd batch request if remote documents are missing
        if (results.skipped.length) {
          const missing = results.skipped
            .filter(({ error }) => error.code == 404)
            .map(({ path }) => {
              const doc = outgoing.find(doc => String(path).endsWith(doc.id));
              delete doc?.last_modified;
              return doc;
            });
          if (missing.length) {
            const r = await kintoCollection.batch(missing);
            mergeAggregatedResponse(results, r);
          }
        }
        // Perform 3rd batch request if remote documents are missing but with conflict
        if (results.conflicts.length) {
          const conflicted = results.conflicts
            .filter(({ remote }) => !remote)
            .map(c => {
              delete c.local.data.last_modified;
              return c.local.data;
            });
          if (conflicted.length) {
            const r = await kintoCollection.batch(conflicted);
            mergeAggregatedResponse(results, r);
          }
        }
        if (results.published.length) {
          // Update local documents with the new published state.
          return (
            results.published
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .filter(({ data }: any) => !data.deleted)
              .map(({ data }) => data)
          );
        }
        return results.conflicts.map(c => c.remote);
      },
      batchSize: push?.batchSize,
      modifier: push?.modifier,
    };
  }

  const replication = new RxReplicationState<RxDocType, KintoCheckpointType>(
    replicationIdentifier,
    collection as RxCollection,
    'deleted',
    _pullImplementation,
    _pushImplementation,
    live,
    retry,
    autoStart
  );

  /**
   * Use (kind-of long) polling to get live changes for the pull.stream$
   * await initial pull replication triggered
   */
  if (live && pull) {
    merge(
      from(replication.awaitInitialReplication()),
      replication.remoteEvents$.pipe(filter(e => e === 'RESYNC'))
    )
      .pipe(
        switchMap(() => interval(pull.heartbeat || 60000)),
        switchMap(() => _pullHandlerResult$),
        NgxRxdbUtils.debug('replication:kinto:longpoll'),
        NgxRxdbUtils.retryWithBackoff(3, retry),
        takeWhile(() => !replication.isStopped())
      )
      .subscribe(pullStream$);
  }

  startReplicationOnLeaderShip(true, replication);

  return replication;
}
