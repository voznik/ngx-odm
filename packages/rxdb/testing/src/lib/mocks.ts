/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference types="jest" />

import { NgxRxdbService, loadRxDBPlugins } from '@ngx-odm/rxdb/core';
import {
  RxCollectionCreator,
  RxDatabaseCreator,
  RxJsonSchema,
  createRxDatabase,
} from 'rxdb';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';

// const rootDir = resolve(__dirname, '../../../../../');
// const dbPath = resolve(rootDir, 'tmp', 'websql', 'test');

type AnyObject = Record<string, any>;

export const TEST_SCHEMA: RxJsonSchema<AnyObject> = {
  type: 'object',
  title: 'Todo',
  description: 'Todo Schema',
  required: ['id', 'title', 'createdAt'],
  version: 0,
  encrypted: undefined,
  properties: {
    id: {
      type: 'string',
      pattern: '^(.*)$',
      maxLength: 32,
    },
    title: {
      type: 'string',
    },
    completed: {
      type: 'boolean',
    },
    createdAt: {
      type: 'number',
      multipleOf: 1,
      minimum: 0,
      maximum: Infinity,
    },
  },
  indexes: ['createdAt'],
  primaryKey: 'id',
};

export const TEST_FEATURE_CONFIG_1: RxCollectionCreator & { name: string } = {
  name: 'todo',
  schema: TEST_SCHEMA,
  localDocuments: true,
  autoMigrate: true,
};

export const TEST_DB_CONFIG_1: RxDatabaseCreator = {
  name: 'test',
  storage: getRxStorageMemory(),
  multiInstance: false,
  ignoreDuplicate: true,
};
export const TEST_DB_CONFIG_2: RxDatabaseCreator = {
  name: 'test',
  storage: getRxStorageMemory(),
  multiInstance: false,
  ignoreDuplicate: true,
  options: {
    storageType: 'dexie',
    schemas: {
      todo: { ...TEST_FEATURE_CONFIG_1 },
    },
  },
};

export const getMockRxCollection = async () => {
  await loadRxDBPlugins();
  const database = await createRxDatabase(TEST_DB_CONFIG_1);
  const { test: collection } = await database.addCollections({
    ['test']: TEST_FEATURE_CONFIG_1,
  });
  Object.getOwnPropertyNames((collection as any).__proto__).forEach(key => {
    if (typeof collection[key] === 'function') {
      jest.spyOn(collection, key as any);
    }
  });

  return collection;
};

export const getMockRxdbService = async () => {
  const collection = await getMockRxCollection();
  const service = {
    db: null,
    collections: {},
    initDb: jest.fn(),
    destroyDb: jest.fn(),
    initCollection: jest.fn(),
  };
  jest.spyOn(service, 'initDb').mockImplementation(() => {
    (service as any).db = Object.freeze(collection.database);
    return Promise.resolve();
  });
  jest.spyOn(service, 'destroyDb').mockImplementation(() => {
    service.db = null;
  });
  jest.spyOn(service, 'initCollection').mockImplementation(() => {
    service.collections['test'] = collection;
    return Promise.resolve(collection);
  });
  Object.setPrototypeOf(service, NgxRxdbService.prototype);
  return service as unknown as NgxRxdbService;
};
