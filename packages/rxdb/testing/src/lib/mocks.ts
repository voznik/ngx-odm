/// <reference types="jest" />

import { resolve } from 'path';
import { NgxRxdbService } from '@ngx-odm/rxdb/core';
import { ensureDirSync } from 'fs-extra';
import {
  RxCollection,
  RxCollectionCreator,
  RxDatabaseCreator,
  RxJsonSchema,
} from 'rxdb/plugins/core';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';
import { EMPTY, of } from 'rxjs';

const rootDir = resolve(__dirname, '../../../../../');
const dbPath = resolve(rootDir, 'tmp', 'websql', 'test');
ensureDirSync(dbPath);

type AnyObject = Record<string, any>;

export const TEST_SCHEMA: RxJsonSchema<AnyObject> = {
  type: 'object',
  title: 'Todo',
  description: 'Todo Schema',
  required: ['id', 'title', 'createdAt'],
  version: 0,
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
};

export const TEST_DB_CONFIG_1: RxDatabaseCreator = {
  name: dbPath, // 'test',
  storage: getRxStorageMemory(),
  multiInstance: false,
  ignoreDuplicate: true,
};
export const TEST_DB_CONFIG_2: RxDatabaseCreator = {
  name: dbPath, // 'test',
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

export const getMocktRxCollection = () => {
  return {
    database: {
      _imported: null,
    } as any,
    name: 'test',
    schema: {},
    storageInstance: {
      internals: Promise.resolve({}),
    },
    destroy: jest.fn().mockResolvedValue(null),
    importJSON: jest.fn().mockResolvedValue(null),
    exportJSON: jest.fn().mockResolvedValue(null),
    find: jest.fn().mockReturnValue({
      $: of([]),
      update: jest.fn().mockResolvedValue(null),
      remove: jest.fn().mockResolvedValue(null),
    }),
    findByIds: jest.fn().mockReturnValue({
      $: of(new Map()),
    }),
    count: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(0),
    }),
    findOne: jest.fn().mockReturnValue({
      $: of(null),
      update: jest.fn().mockResolvedValue(null),
      remove: jest.fn().mockResolvedValue(null),
    }),
    insert: jest.fn().mockResolvedValue(null),
    insert$: EMPTY,
    bulkInsert: jest.fn().mockResolvedValue(
      of({
        success: [],
        error: [],
      })
    ),
    upsert: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue([]),
    remove: jest.fn().mockResolvedValue(null),
    remove$: EMPTY,
    getLocal: jest.fn().mockResolvedValue(null),
    getLocal$: jest.fn().mockReturnValue(of(null)),
    insertLocal: jest.fn().mockResolvedValue(null),
    upsertLocal: jest.fn().mockResolvedValue(null),
  } as unknown as RxCollection<any>;
};

export const getMockRxdbServiceFactory = (): NgxRxdbService => {
  const service = {
    db: {
      _imported: null,
    } as any,
    collections: {
      test: getMocktRxCollection(),
    },
    initDb: jest.fn().mockResolvedValue({}),
    destroyDb: jest.fn().mockResolvedValue({}),
    initCollection: jest.fn().mockResolvedValue(getMocktRxCollection()),
    // initCollections = this.initCollection;
  } as unknown as NgxRxdbService;
  Object.setPrototypeOf(service, NgxRxdbService.prototype);
  return service;
};
