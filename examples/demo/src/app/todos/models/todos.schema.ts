import type { RxCollectionCreatorExtended } from '@ngx-odm/rxdb/config';
import type { MigrationStrategies, RxCollection } from 'rxdb';
import { TODOS_INITIAL_STATE } from './todos.model';

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
  statics: collectionMethods,
  schema: null,
  options: {
    schemaUrl: 'assets/data/todo.schema.json',
    initialDocs: TODOS_INITIAL_STATE.items,
  },
};
