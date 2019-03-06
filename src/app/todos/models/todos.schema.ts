import { NgxRxdbCollectionConfig } from 'ngx-rxdb';

export async function percentageDoneFn() {
  const allDocs = await this.find().exec();
  return allDocs.filter(doc => !!doc.done).length / allDocs.length;
}
const collectionMethods = {
  percentageDone: percentageDoneFn,
};

declare var require: any;
const todoSchema = require('../../../assets/data/todo.schema.json');

export const TODO_SCHEMA: NgxRxdbCollectionConfig = {
  name: 'todo',
  schema: todoSchema,
  statics: collectionMethods,
  options: {
    schemaUrl: '../../../assets/data/todo.schema.json',
  }
};
