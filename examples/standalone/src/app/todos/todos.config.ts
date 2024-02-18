import { RxCollectionCreatorExtended } from '@ngx-odm/rxdb/config';
import { conflictHandlerKinto, replicateKintoDB } from '@ngx-odm/rxdb/replication-kinto';
import { getDefaultFetchWithHeaders } from '@ngx-odm/rxdb/utils';
import {
  RxConflictHandler,
  RxConflictHandlerInput,
  RxConflictHandlerOutput,
  b64EncodeUnicode,
  deepEqual,
} from 'rxdb';
import { RxReplicationState } from 'rxdb/plugins/replication';
import { replicateCouchDB } from 'rxdb/plugins/replication-couchdb';
import { environment } from '../../environments/environment';
import { TODOS_INITIAL_STATE, Todo } from './todos.model';

export const defaultConflictHandler: RxConflictHandler<any> = function (
  /**
   * The conflict handler gets 3 input properties:
   * - assumedMasterState: The state of the document that is assumed to be on the master branch
   * - newDocumentState: The new document state of the fork branch (=client) that RxDB want to write to the master
   * - realMasterState: The real master state of the document
   */
  i: RxConflictHandlerInput<any>
): Promise<RxConflictHandlerOutput<any>> {
  /**
   * Here we detect if a conflict exists in the first place.
   * If there is no conflict, we return isEqual=true.
   * If there is a conflict, return isEqual=false.
   * In the default handler we do a deepEqual check,
   * but in your custom conflict handler you probably want
   * to compare specific properties of the document, like the updatedAt time,
   * for better performance because deepEqual() is expensive.
   */
  if (deepEqual(i.newDocumentState, i.realMasterState)) {
    return Promise.resolve({
      isEqual: true,
    });
  }

  /**
   * If a conflict exists, we have to resolve it.
   * The default conflict handler will always
   * drop the fork state and use the master state instead.
   *
   * In your custom conflict handler you likely want to merge properties
   * of the realMasterState and the newDocumentState instead.
   */
  return Promise.resolve({
    isEqual: false,
    documentData: i.realMasterState,
  });
};

export const TodosCollectionConfig: RxCollectionCreatorExtended = {
  name: 'todo',
  localDocuments: true,
  schema: undefined, // to load schema from remote url pass `undefined` here
  options: {
    schemaUrl: 'assets/data/todo.schema.json', // load schema from remote url
    initialDocs: TODOS_INITIAL_STATE.items, // populate collection with initial data,
    useQueryParams: true,
    replicationStateFactory: collection => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let replicationState: RxReplicationState<Todo, any> | null = null;

      switch (localStorage['_ngx_rxdb_replication']) {
        case 'kinto': {
          replicationState = replicateKintoDB<Todo>({
            replicationIdentifier: 'demo-kinto-replication:todo',
            collection,
            kintoSyncOptions: {
              remote: environment.kintoServer,
              bucket: environment.bucket,
              collection: environment.collection,
            },
            fetch: getDefaultFetchWithHeaders({
              Authorization: 'Basic ' + b64EncodeUnicode('admin:adminadmin'),
            }),
            retryTime: 15000,
            live: true,
            autoStart: true,
            pull: {
              batchSize: 60,
              modifier: d => d,
              heartbeat: 60000,
            },
            push: {
              modifier: d => d,
            },
          });
          break;
        }
        case 'couchdb': {
          replicationState = replicateCouchDB<Todo>({
            replicationIdentifier: 'demo-couchdb-replication',
            collection,
            fetch: getDefaultFetchWithHeaders({
              Authorization: 'Basic ' + b64EncodeUnicode('admin:adminadmin'),
            }),
            url: 'http://localhost:5984/todos/',
            retryTime: 15000,
            live: true,
            autoStart: true,
            pull: {
              batchSize: 60,
              modifier: d => d,
              heartbeat: 60000,
            },
            push: {
              modifier: d => d,
            },
          });
          break;
        }
        default: {
          break;
        }
      }

      return replicationState;
    },
  },
  autoMigrate: true,
  migrationStrategies: {
    1: function (doc) {
      if (doc._deleted) {
        return null;
      }
      doc.last_modified = new Date(doc.createdAt).getTime(); // string to unix
      return doc;
    },
    2: function (doc) {
      if (doc._deleted) {
        return null;
      }
      doc.createdAt = new Date(doc.createdAt).toISOString(); // to string
      return doc;
    },
    3: d => d,
  },
  conflictHandler:
    localStorage['_ngx_rxdb_replication'] === 'kinto'
      ? conflictHandlerKinto
      : defaultConflictHandler,
};
