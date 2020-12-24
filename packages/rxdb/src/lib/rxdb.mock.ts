import { RxCollectionCreator, RxJsonSchema } from 'rxdb';
import { NgxRxdbCollectionConfig } from './rxdb.d';

export const TEST_SCHEMA: RxJsonSchema = {
  type: 'object',
  title: 'Todo',
  description: 'Todo Schema',
  required: ['id', 'title', 'createdAt'],
  version: 0,
  properties: {
    id: {
      type: 'string',
      primary: true,
      pattern: '^(.*)$',
    },
    title: {
      type: 'string',
    },
    completed: {
      type: 'boolean',
    },
    createdAt: {
      type: 'number',
    },
  },
  indexes: ['createdAt'],
};

export const TEST_FEATURE_CONFIG_1: RxCollectionCreator = {
  name: 'todo',
  schema: TEST_SCHEMA,
};

export const TEST_DB_CONFIG_1 = { name: 'test1', adapter: 'memory' };
export const TEST_DB_CONFIG_2 = {
  name: 'test2',
  adapter: 'memory',
  options: {
    schemas: {
      todo: { ...TEST_FEATURE_CONFIG_1 },
    },
  },
};
