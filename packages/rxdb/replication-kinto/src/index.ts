/**
 * This plugin can be used to sync collections with a remote KintoDB endpoint.
 */
import { awaitRetry } from '@ngx-odm/rxdb/utils';
import { addRxPlugin, newRxError, WithDeleted } from 'rxdb';
import type {
  RxCollection,
  ReplicationPullOptions,
  ReplicationPushOptions,
  RxReplicationWriteToMasterRow,
  RxReplicationPullStreamItem,
  RxConflictHandler,
} from 'rxdb';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import { RxReplicationState, startReplicationOnLeaderShip } from 'rxdb/plugins/replication';
import {
  ensureNotFalsy,
  errorToPlainJson,
  flatClone,
  getFromMapOrThrow,
  now,
  promiseWait,
} from 'rxdb/plugins/utils';
import { Subject } from 'rxjs';
import {
  kintoDBDocToRxDocData,
  mergeUrlQueryParams,
  kintoSwapPrimaryToId,
  getDefaultFetch,
} from './helpers';

type KintoDBCheckpointType = any;
type FetchMethodType = any;
type SyncOptionsKintoDB<T> = any;
type KintodbChangesResult = any;
type KintoBulkDocResultRow = any;
type KintoAllDocsResponse = any;

export class RxKintoDBReplicationState<RxDocType> extends RxReplicationState<
  RxDocType,
  KintoDBCheckpointType
> {
  constructor(
    public readonly url: string,
    public fetch: FetchMethodType,
    public override readonly replicationIdentifier: string,
    public override readonly collection: RxCollection<RxDocType>,
    public override readonly pull?: ReplicationPullOptions<
      RxDocType,
      KintoDBCheckpointType
    >,
    public override readonly push?: ReplicationPushOptions<RxDocType>,
    public override readonly live: boolean = true,
    public override retryTime: number = 1000 * 5,
    public override autoStart: boolean = true
  ) {
    super(
      replicationIdentifier,
      collection,
      '_deleted',
      pull,
      push,
      live,
      retryTime,
      autoStart
    );
  }
}

export function replicateKintoDB<RxDocType>(options: SyncOptionsKintoDB<RxDocType>) {
  const collection = options.collection;
  const conflictHandler: RxConflictHandler<any> = collection.conflictHandler;
  addRxPlugin(RxDBLeaderElectionPlugin);
  const primaryPath = options.collection.schema.primaryPath;

  if (!options.url.endsWith('/')) {
    throw newRxError('RC_COUCHDB_1', {
      args: {
        collection: options.collection.name,
        url: options.url,
      },
    });
  }

  options = flatClone(options);
  if (!options.url.endsWith('/')) {
    options.url = options.url + '/';
  }
  options.waitForLeadership =
    typeof options.waitForLeadership === 'undefined' ? true : options.waitForLeadership;
  const pullStream$: Subject<
    RxReplicationPullStreamItem<RxDocType, KintoDBCheckpointType>
  > = new Subject();
  let replicationPrimitivesPull:
    | ReplicationPullOptions<RxDocType, KintoDBCheckpointType>
    | undefined;
  if (options.pull) {
    replicationPrimitivesPull = {
      async handler(
        lastPulledCheckpoint: KintoDBCheckpointType | undefined,
        batchSize: number
      ) {
        /**
         * @see https://docs.kintodb.org/en/3.2.2-docs/api/database/changes.html
         */
        const url =
          options.url +
          '_changes?' +
          mergeUrlQueryParams({
            style: 'all_docs',
            feed: 'normal',
            include_docs: true,
            since: lastPulledCheckpoint ? lastPulledCheckpoint.sequence : 0,
            heartbeat:
              options.pull && options.pull.heartbeat ? options.pull.heartbeat : 60000,
            limit: batchSize,
            seq_interval: batchSize,
          });

        const response = await replicationState.fetch(url);
        const jsonResponse: KintodbChangesResult = await response.json();
        if (!jsonResponse.results) {
          throw newRxError('RC_COUCHDB_2', {
            args: { jsonResponse },
          });
        }
        const documents: WithDeleted<RxDocType>[] = jsonResponse.results.map((row: any) =>
          kintoDBDocToRxDocData(collection.schema.primaryPath, ensureNotFalsy(row.doc))
        );
        return {
          documents,
          checkpoint: {
            sequence: jsonResponse.last_seq,
          },
        };
      },
      batchSize: ensureNotFalsy(options.pull).batchSize,
      modifier: ensureNotFalsy(options.pull).modifier,
      stream$: pullStream$.asObservable(),
    };
  }

  let replicationPrimitivesPush: ReplicationPushOptions<RxDocType> | undefined;
  if (options.push) {
    replicationPrimitivesPush = {
      async handler(rows: RxReplicationWriteToMasterRow<RxDocType>[]) {
        const conflicts: WithDeleted<RxDocType>[] = [];
        const pushRowsById = new Map<string, RxReplicationWriteToMasterRow<RxDocType>>();
        rows.forEach(row => {
          const id = (row.newDocumentState as any)[primaryPath];
          pushRowsById.set(id, row);
        });

        /**
         * First get the current master state from the remote
         * to check for conflicts
         */
        const docsByIdResponse = await replicationState.fetch(
          options.url + '_all_docs?' + mergeUrlQueryParams({}),
          {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              keys: rows.map(row => (row.newDocumentState as any)[primaryPath]),
              include_docs: true,
              deleted: 'ok',
            }),
          }
        );
        const docsByIdRows: KintoAllDocsResponse = await docsByIdResponse.json();
        const nonConflictRows: typeof rows = [];
        const remoteRevById = new Map<string, string>();
        await Promise.all(
          docsByIdRows.rows.map(async (row: any) => {
            if (!row.doc) {
              nonConflictRows.push(getFromMapOrThrow(pushRowsById, row.key));
              return;
            }
            const realMasterState: WithDeleted<RxDocType> = kintoDBDocToRxDocData(
              primaryPath,
              row.doc
            );
            const pushRow = getFromMapOrThrow(pushRowsById, row.id);
            const conflictHandlerResult = await conflictHandler(
              {
                realMasterState,
                newDocumentState: pushRow.assumedMasterState,
              },
              'kintodb-push-1'
            );
            if (conflictHandlerResult.isEqual) {
              remoteRevById.set(row.id, row.doc._rev);
              nonConflictRows.push(pushRow);
            } else {
              conflicts.push(realMasterState);
            }
          })
        );

        /**
         * @see https://docs.kintodb.org/en/3.2.2-docs/api/database/bulk-api.html#db-bulk-docs
         */
        const url = options.url + '_bulk_docs?' + mergeUrlQueryParams({});
        const body = {
          docs: nonConflictRows.map(row => {
            const docId = (row.newDocumentState as any)[primaryPath];
            const sendDoc = flatClone(row.newDocumentState);
            if (remoteRevById.has(docId)) {
              (sendDoc as any)._rev = getFromMapOrThrow(remoteRevById, docId);
            }
            return kintoSwapPrimaryToId(collection.schema.primaryPath, sendDoc);
          }),
        };

        const response = await replicationState.fetch(url, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        const responseJson: KintoBulkDocResultRow[] = await response.json();

        // get conflicting writes
        const conflictAgainIds: string[] = [];
        responseJson.forEach(writeResultRow => {
          const isConflict = writeResultRow.error === 'conflict';
          if (!writeResultRow.ok && !isConflict) {
            throw newRxError('SNH', { args: { writeResultRow } });
          }
          if (isConflict) {
            conflictAgainIds.push(writeResultRow.id);
          }
        });

        if (conflictAgainIds.length === 0) {
          return conflicts;
        }

        const getConflictDocsUrl =
          options.url +
          '_all_docs?' +
          mergeUrlQueryParams({
            include_docs: true,
            keys: JSON.stringify(conflictAgainIds),
          });
        const conflictResponse = await replicationState.fetch(getConflictDocsUrl);
        const conflictResponseJson: KintoAllDocsResponse = await conflictResponse.json();
        conflictResponseJson.rows.forEach((conflictAgainRow: any) => {
          conflicts.push(
            kintoDBDocToRxDocData(collection.schema.primaryPath, conflictAgainRow.doc)
          );
        });

        return conflicts;
      },
      batchSize: options.push.batchSize,
      modifier: options.push.modifier,
    };
  }

  const replicationState = new RxKintoDBReplicationState<RxDocType>(
    options.url,
    options.fetch ? options.fetch : getDefaultFetch(),
    options.replicationIdentifier,
    collection,
    replicationPrimitivesPull,
    replicationPrimitivesPush,
    options.live,
    options.retryTime,
    options.autoStart
  );

  /**
   * Use long polling to get live changes for the pull.stream$
   */
  if (options.live && options.pull) {
    const startBefore = replicationState.start.bind(replicationState);
    replicationState.start = () => {
      let since: string | number = 'now';
      const batchSize =
        options.pull && options.pull.batchSize ? options.pull.batchSize : 20;

      (async () => {
        let lastRequestStartTime = now();
        while (!replicationState.isStopped()) {
          const url =
            options.url +
            '_changes?' +
            mergeUrlQueryParams({
              style: 'all_docs',
              feed: 'longpoll',
              since,
              include_docs: true,
              heartbeat:
                options.pull && options.pull.heartbeat ? options.pull.heartbeat : 60000,
              limit: batchSize,
              seq_interval: batchSize,
            });

          let jsonResponse: KintodbChangesResult;
          try {
            lastRequestStartTime = now();
            jsonResponse = await (await replicationState.fetch(url)).json();
          } catch (err: any) {
            replicationState.subjects.error.next(
              newRxError('RC_STREAM', {
                args: { url },
                error: errorToPlainJson(err),
              })
            );

            if (lastRequestStartTime < now() - replicationState.retryTime) {
              /**
               * Last request start was long ago,
               * so we directly retry.
               * This mostly happens on timeouts
               * which are normal behavior for long polling requests.
               */
              await promiseWait(0);
            } else {
              // await next tick here otherwise we could go in to a 100% CPU blocking cycle.
              await awaitRetry(collection, replicationState.retryTime);
            }
            continue;
          }
          const documents: WithDeleted<RxDocType>[] = jsonResponse.results.map((row: any) =>
            kintoDBDocToRxDocData(collection.schema.primaryPath, ensureNotFalsy(row.doc))
          );
          since = jsonResponse.last_seq;

          pullStream$.next({
            documents,
            checkpoint: {
              sequence: jsonResponse.last_seq,
            },
          });
        }
      })();
      return startBefore();
    };
  }

  startReplicationOnLeaderShip(options.waitForLeadership, replicationState);

  return replicationState;
}
