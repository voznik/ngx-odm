/* eslint-disable @typescript-eslint/no-explicit-any */
import { NgxRxdbUtils } from '@ngx-odm/rxdb/utils';
import { KintoClient } from 'kinto';
import type { AggregateResponse } from 'kinto/lib/http';
import type { FetchFunction } from 'kinto/lib/types';
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
  tap,
  timer,
} from 'rxjs';
import { DEFAULT_REPLICATION_OPTIONS } from './helpers';
import {
  KintoCheckpointType,
  KintoListParams,
  KintoListResponse,
  KintoReplicationOptions,
} from './types';

class RxKintoDBReplicationState<RxDocType> extends RxReplicationState<
  RxDocType,
  KintoCheckpointType
> {
  constructor(
    public readonly kintoSyncOptions: KintoReplicationOptions['kintoSyncOptions'],
    public override readonly replicationIdentifier: string,
    public override readonly collection: RxCollection<RxDocType>,
    public override readonly pull?: ReplicationPullOptions<RxDocType, KintoCheckpointType>,
    public override readonly push?: ReplicationPushOptions<RxDocType>,
    public override readonly live: boolean = true,
    public override retryTime: number = 1000 * 5,
    public override autoStart: boolean = true
  ) {
    super(
      replicationIdentifier,
      collection,
      'deleted',
      pull,
      push,
      live,
      retryTime,
      autoStart
    );
  }
}

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
export function replicateKintoDB<RxDocType>(options: KintoReplicationOptions) {
  const {
    replicationIdentifier,
    kintoSyncOptions,
    fetch: fetchFunc,
    pull,
    push,
    collection,
    retryTime: retry,
    live,
    autoStart,
    waitForLeadership,
    deletedField,
  } = Object.assign(DEFAULT_REPLICATION_OPTIONS, options);
  addRxPlugin(RxDBLeaderElectionPlugin);
  /* eslint-disable prefer-const, @typescript-eslint/no-non-null-assertion */
  let {
    remote,
    bucket,
    collection: collectionName,
    headers,
    exclude,
    expectedTimestamp,
    timeout,
    heartbeat,
    strategy,
  } = kintoSyncOptions;
  // Optionally ignore some records when pulling for changes.
  let filters: KintoListParams['filters'] = {};
  if (exclude) {
    const exclude_id = exclude
      .slice(0, 50)
      .map(r => r.id)
      .join(',');
    filters = { exclude_id };
  }
  if (expectedTimestamp) {
    filters = {
      ...filters,
      _expected: expectedTimestamp,
    };
  }

  const client = new KintoClient(remote!, {
    timeout,
    headers,
    retry,
    fetchFunc: fetchFunc as unknown as FetchFunction,
  });

  const kintoCollection = client.bucket(bucket!).collection(collectionName!);
  /* eslint-enable prefer-const, @typescript-eslint/no-non-null-assertion */

  const pullStream$: Subject<DocumentsWithCheckpoint<RxDocType, KintoCheckpointType>> =
    new Subject();

  let _pullImplementation:
    | ReplicationPullOptions<RxDocType, KintoCheckpointType>
    | undefined;
  let _pushImplementation: ReplicationPushOptions<RxDocType> | undefined;
  let _pullHandlerResult$: Observable<DocumentsWithCheckpoint<any, KintoCheckpointType>> =
    EMPTY;

  if (pull) {
    _pullImplementation = {
      async handler(lastPulledCheckpoint, batchSize) {
        let since = lastPulledCheckpoint?.last_modified || undefined;

        // Create an Observable that emits every POLLING_INTERVAL milliseconds if live is true, otherwise emits once
        _pullHandlerResult$ = interval(heartbeat).pipe(
          startWith(0),
          switchMap(() =>
            kintoCollection.listRecords({
              since,
              headers,
              retry,
              pages: Infinity,
              filters,
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
        const safe = !strategy || strategy !== undefined;
        const toDelete = new Map<string, any>();
        const toSync = new Map<string, any>();
        changes.forEach(({ newDocumentState: doc }: any) => {
          if (doc._deleted) {
            toDelete.set(doc.id, doc);
          } else {
            // Clean local fields (like _deleted) before sending to server.
            delete (doc as any)._deleted;
            toSync.set(doc.id, doc);
          }
        });

        // Perform a batch request with every changes.
        const { conflicts, errors, published } = (await kintoCollection.batch(
          batch => {
            toDelete.forEach(({ last_modified, ...r }: any) => {
              // never published locally deleted records should not be pusblished
              if (last_modified) {
                batch.deleteRecord(r, {
                  last_modified,
                });
              }
            });
            toSync.forEach(({ last_modified, ...r }: any) => {
              if (!last_modified) {
                batch.createRecord(r);
              } else {
                batch.updateRecord(r, {
                  last_modified,
                });
              }
            });
          },
          {
            headers,
            retry,
            safe,
            aggregate: true,
          }
        )) as AggregateResponse;

        if (errors.length) {
          NgxRxdbUtils.logger.log(errors);
        }

        if (published.length) {
          // Update local documents with the new published state.
          const toUpdate: any[] = published
            .filter(({ data }: any) => !toDelete.has(data.id))
            .map(({ data }) => data);
          return toUpdate;
        }
        return conflicts.map(c => c.remote);
      },
      batchSize: push?.batchSize,
      modifier: push?.modifier,
    };
  }

  const replication = new RxKintoDBReplicationState<RxDocType>(
    kintoSyncOptions,
    replicationIdentifier,
    collection as RxCollection,
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
        tap(pullStream$),
        retryWhen(errors =>
          errors.pipe(
            NgxRxdbUtils.debug('replication long-poll error'),
            delayWhen(() => timer(retry))
          )
        ),
        takeUntil(replication.canceled$)
      )
      .subscribe();
  }

  startReplicationOnLeaderShip(true, replication);

  return replication;
}

export * from './types';
