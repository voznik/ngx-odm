/* eslint-disable @typescript-eslint/no-unused-vars */
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
  delayWhen,
  first,
  from,
  interval,
  map,
  retryWhen,
  skip,
  startWith,
  switchMap,
  takeUntil,
  timer,
} from 'rxjs';
import { DEFAULT_REPLICATION_OPTIONS, kintoCollectionFactory } from './helpers';
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

  if (pull) {
    _pullImplementation = {
      async handler(lastPulledCheckpoint, batchSize) {
        let since = lastPulledCheckpoint?.last_modified || undefined;
        //  Assign function to poll for remote changes.
        _pullHandlerResult$ = interval(options.kintoSyncOptions.heartbeat).pipe(
          startWith(0),
          switchMap(() =>
            kintoCollection.listRecords({
              sort: '-last_modified',
              since,
              pages: Infinity, // TODO: use batchSize
            })
          ),
          map(({ data: documents, last_modified }: KintoListResponse<any>) => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            since = last_modified!;
            return {
              documents,
              checkpoint: { last_modified },
            };
          })
          // TODO:
          // catchError(err => {
          //   NgxRxdbUtils.logger.log(err);
          //   return throwError(err);
          // })
        );

        return _pullHandlerResult$.pipe(first()).toPromise() as Promise<any>;
      },
      batchSize: pull?.batchSize,
      modifier: pull?.modifier,
      stream$: pullStream$.asObservable(),
    };
  }

  if (push) {
    _pushImplementation = {
      async handler(changes) {
        const toDelete: RxDocType[] = [];
        const toUpdate: RxDocType[] = [];
        const toCreate: RxDocType[] = [];
        changes.forEach(({ newDocumentState: doc }) => {
          if (doc.deleted) {
            toDelete.push(doc);
          } else if (doc.last_modified) {
            toUpdate.push(doc);
          } else {
            toCreate.push(doc);
          }
        });

        // Perform a batch request with every changes.
        const { conflicts, errors, published } = (await kintoCollection.batch({
          toCreate,
          toUpdate,
          toDelete,
        })) as KintoAggregateResponse;

        if (errors.length) {
          NgxRxdbUtils.logger.log(errors);
        } else if (published.length) {
          // Update local documents with the new published state.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return published.filter(({ data }: any) => !data.deleted).map(({ data }) => data);
        }
        return conflicts.map(c => c.remote);
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
    from(replication.awaitInitialReplication())
      .pipe(
        switchMap(() => _pullHandlerResult$),
        skip(1),
        NgxRxdbUtils.debug('replication long-poll'),
        retryWhen(errors =>
          errors.pipe(
            NgxRxdbUtils.debug('replication long-poll error'),
            delayWhen(() => timer(retry))
          )
        ),
        takeUntil(replication.canceled$)
      )
      .subscribe(pullStream$);
  }

  startReplicationOnLeaderShip(true, replication);

  return replication;
}

export * from './helpers';
export * from './types';
