/// <reference types="jest" />

import { resolve } from 'path';
import type { NgxRxdbConfig } from '@ngx-odm/rxdb/config';
import { NgxRxdbService } from '@ngx-odm/rxdb/core';
import { ensureDirSync } from 'fs-extra';
import { RxCollection, RxCollectionCreator, RxJsonSchema } from 'rxdb/plugins/core';
import { of } from 'rxjs';

const rootDir = resolve(__dirname, '../../../../../');
const dbPath = resolve(rootDir, 'tmp', 'websql', 'test');
ensureDirSync(dbPath);

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

export const TEST_DB_CONFIG_1: NgxRxdbConfig = {
  name: dbPath, // 'test',
  adapter: 'websql',
  multiInstance: false,
  ignoreDuplicate: true,
};
export const TEST_DB_CONFIG_2: NgxRxdbConfig = {
  name: dbPath, // 'test',
  adapter: 'websql',
  multiInstance: false,
  ignoreDuplicate: true,
  options: {
    schemas: {
      todo: { ...TEST_FEATURE_CONFIG_1 },
    },
  },
};

export class MockNgxRxdbService extends NgxRxdbService {
  // private _imported = 0;
  // private dbInstance = {} as any;
  override get db() {
    return {} as any;
  }
  override get collections() {
    return {} as any;
  }
  override initDb = jest.fn().mockResolvedValue({});
  override destroyDb = jest.fn().mockResolvedValue({});
  override initCollection = jest.fn().mockResolvedValue({
    find: jest.fn().mockReturnValue({
      $: of({ id: '0' }),
      remove: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue([]),
    }),
    findOne: jest.fn().mockReturnValue({
      $: of({ id: '0' }),
      remove: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
    }),
    findByIds$: jest.fn().mockReturnValue(of(new Map([[0, { id: '0' }]]))),
    pouch: {
      allDocs: jest.fn().mockResolvedValue({ rows: [{ id: '0' }] }),
      bulkDocs: jest.fn().mockResolvedValue([]),
    },
    insert: jest.fn().mockImplementation(obj => of(obj)),
    bulkInsert: jest.fn().mockImplementation(arr => Promise.resolve(arr)),
    upsert: jest.fn().mockImplementation(obj => of(obj)),
  } as unknown as RxCollection);
  override initCollections = this.initCollection;
  override getCollection = jest.fn().mockReturnValue({});
  override syncCollection = jest.fn().mockReturnValue({});
  override syncAllCollections = jest.fn().mockReturnValue({});
  override importDbDump = jest.fn().mockResolvedValue({});
  override importColDump = jest.fn().mockResolvedValue({});
  // prepareCollections = jest.fn().mockResolvedValue({});
  // prepareDbDump = jest.fn().mockResolvedValue({});
}
