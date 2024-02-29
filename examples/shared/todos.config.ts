import type { RxCollectionCreatorExtended } from '@ngx-odm/rxdb/config';
import type { RxCollection } from 'rxdb';
import { todosConflictHandler } from './todos.conflictHandler';
import { todosMigrations } from './todos.migration';
import { TODOS_INITIAL_ITEMS } from './todos.model';
import { todosReplicationStateFactory } from './todos.replication';

export async function percentageCompletedFn() {
  const allDocs = await (this as RxCollection).find().exec();
  return allDocs.filter(doc => !!doc.completed).length / allDocs.length;
}
const collectionMethods = {
  percentageCompleted: percentageCompletedFn,
};

export const TODOS_COLLECTION_CONFIG: RxCollectionCreatorExtended = {
  name: 'todo',
  localDocuments: true,
  schema: undefined, // to load schema from remote url pass `undefined` here
  options: {
    schemaUrl: 'assets/data/todo.schema.json', // load schema from remote url
    initialDocs: TODOS_INITIAL_ITEMS, // populate collection with initial data,
    useQueryParams: localStorage['_ngx_rxdb_queryparams'] === 'true', // bind collection filtering/sorting to URL query params,
    replicationStateFactory: todosReplicationStateFactory, // create replication state for collection
  },
  statics: collectionMethods,
  // in this example we have 3 migrations, since the beginning of development
  migrationStrategies: todosMigrations,
  conflictHandler: todosConflictHandler, // don't need custom for CouchDb example
};
