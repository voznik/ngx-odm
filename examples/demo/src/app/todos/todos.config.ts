import type { RxCollectionCreatorExtended } from '@ngx-odm/rxdb/config';
import { deepEqual } from 'rxdb';
import type {
  RxConflictHandler,
  RxConflictHandlerInput,
  RxConflictHandlerOutput,
  RxCollection,
} from 'rxdb';
import { TODOS_INITIAL_ITEMS, Todo } from './todos.model';

/**
 * The default conflict handler is a function that gets called when a conflict is detected.
 * In your custom conflict handler you likely want to merge properties of the realMasterState and the newDocumentState instead.
 * @param i
 * @see https://rxdb.info/replication.html#conflict-handling
 */
const defaultConflictHandler: RxConflictHandler<Todo> = function (
  i: RxConflictHandlerInput<Todo>
): Promise<RxConflictHandlerOutput<Todo>> {
  if (deepEqual(i.newDocumentState, i.realMasterState)) {
    return Promise.resolve({
      isEqual: true,
    });
  }
  return Promise.resolve({
    isEqual: false,
    documentData: i.realMasterState,
  });
};

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
    useQueryParams: true, // bind `local` doc data to URL query params
  },
  statics: collectionMethods,
  // in this example we have 3 migrations, since the beginning of development
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
  conflictHandler: defaultConflictHandler, // don't need custom for CouchDb example
};
