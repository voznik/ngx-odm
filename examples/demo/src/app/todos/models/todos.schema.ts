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

const TODO_SCHEMA = {
  definitions: {},
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  title: 'Todo',
  description: 'Todo Schema',
  required: ['id', 'title', 'createdAt'],
  version: 0,
  properties: {
    id: {
      type: 'string',
      title: 'Id',
      pattern: '^(.*)$',
      maxLength: 32,
    },
    title: {
      type: 'string',
      title: 'Title',
    },
    completed: {
      type: 'boolean',
      title: 'Done',
    },
    createdAt: {
      type: 'number',
      title: 'Date Created',
      multipleOf: 1,
      minimum: 1697722545,
      maximum: 1918647345,
    },
  },
  __indexes: ['createdAt'],
  primaryKey: 'id',
};

export const TODOS_COLLECTION_CONFIG: NgxRxdbCollectionConfig = {
  name: 'todo',
  localDocuments: true,
  statics: collectionMethods,
  // schema: TODO_SCHEMA,
  options: {
    schemaUrl: 'assets/data/todo.schema.json',
    initialDocs: initialState.items,
  },
};
