import { NgxRxdbCollectionConfig } from '@ngx-odm/rxdb/config';
import { RxCollection } from 'rxdb';
import { initialState } from './todos.model';

export async function percentageCompletedFn() {
  const allDocs = await (this as RxCollection).find().exec();
  return allDocs.filter(doc => !!doc.completed).length / allDocs.length;
}
const collectionMethods = {
  percentageCompleted: percentageCompletedFn,
};

export const TODOS_COLLECTION_CONFIG: NgxRxdbCollectionConfig = {
  name: 'todo',
  localDocuments: true,
  statics: collectionMethods,
  schema: null,
  options: {
    schemaUrl: 'assets/data/todo.schema.json',
    initialDocs: initialState.items,
  },
};
