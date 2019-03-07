import { isDevMode } from '@angular/core';
import { NgxRxdbCollectionConfig } from 'ngx-rxdb';
import { initialState } from './todos.model';

export async function percentageDoneFn() {
  const allDocs = await this.find().exec();
  return allDocs.filter(doc => !!doc.done).length / allDocs.length;
}
const collectionMethods = {
  percentageDone: percentageDoneFn,
};

// declare var require: any;
// FIXME: can we just import json here?
// isDevMode ? require('../../../assets/data/todo.schema.json')
const todoSchema = {
  definitions: {},
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  title: 'Todo',
  description: 'Todo Schema',
  required: ['guid', 'name'],
  version: 0,
  properties: {
    guid: {
      type: 'string',
      title: 'Id',
      primary: true,
      pattern: '^(.*)$',
    },
    name: {
      type: 'string',
      title: 'Todo',
    },
    done: {
      type: 'boolean',
      title: 'Done',
    },
    dateCreated: {
      type: 'number',
      title: 'Date Created',
      index: true,
    },
  },
};

export const TODO_SCHEMA: NgxRxdbCollectionConfig = {
  name: 'todo',
  schema: todoSchema,
  statics: collectionMethods,
  options: {
    schemaUrl: 'assets/data/todo.schema.json',
    initialDocs: initialState.items,
  },
};
