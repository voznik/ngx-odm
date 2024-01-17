import { replicateKintoDB } from '@ngx-odm/rxdb/replication-kinto';
import { getDefaultFetchWithHeaders } from '@ngx-odm/rxdb/utils';
import { b64EncodeUnicode } from 'rxdb';
import { RxReplicationState } from 'rxdb/plugins/replication';
import { replicateCouchDB } from 'rxdb/plugins/replication-couchdb';
import { environment } from '../../environments/environment';
import { Todo } from './todos.model';

export const todosReplicationStateFactory = collection => {
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
        url: 'http://localhost:5984/demo/',
        retryTime: 15000,
        live: true,
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
};
