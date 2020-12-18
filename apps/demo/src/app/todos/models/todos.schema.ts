import { NgxRxdbCollectionConfig } from '@ngx-odm/rxdb';
import { initialState } from './todos.model';

export async function percentageCompletedFn() {
  const allDocs = await this.find().exec();
  return allDocs.filter(doc => !!doc.completed).length / allDocs.length;
}
const collectionMethods = {
  percentageCompleted: percentageCompletedFn,
};

export const TODOS_COLLECTION_CONFIG: NgxRxdbCollectionConfig = {
  name: 'todo',
  // schema: todoSchema,
  statics: collectionMethods,
  options: {
    schemaUrl: 'assets/data/todo.schema.json',
    initialDocs: initialState.items,
  },
};
