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

export type TestDocType = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
};

export const TEST_SCHEMA: RxJsonSchema<TestDocType> = {
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
  name: 'test',
  schema: TEST_SCHEMA,
  localDocuments: true,
  autoMigrate: true,
  options: {
    replicationStateFactory: undefined,
  },
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
    initCollections: jest.fn(),
  };
  jest.spyOn(service, 'initDb').mockImplementation(() => {
    (service as any).db = collection.database;
    return Promise.resolve();
  });
  jest.spyOn(service, 'destroyDb').mockImplementation(() => {
    service.db = null;
  });
  jest.spyOn(service, 'initCollections').mockImplementation(() => {
    service.collections['test'] = collection;
    return Promise.resolve(service.collections);
  });
  Object.setPrototypeOf(service, NgxRxdbService.prototype);
  return service as unknown as NgxRxdbService;
};
