import { RxCollection, RxCollectionCreator, RxJsonSchema } from 'rxdb/plugins/core';
import { of } from 'rxjs';
import { NgxRxdbCollectionConfig, NgxRxdbConfig } from './rxdb.model';
import { NgxRxdbService } from './rxdb.service';

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
  name: 'test1',
  adapter: 'memory',
  multiInstance: false,
  ignoreDuplicate: true,
};
export const TEST_DB_CONFIG_2: NgxRxdbConfig = {
  name: 'test2',
  adapter: 'memory',
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
  get db() {
    return {} as any;
  }
  get collections() {
    return {} as any;
  }
  initDb = jest.fn().mockResolvedValue({});
  destroyDb = jest.fn().mockResolvedValue({});
  initCollection = jest.fn().mockResolvedValue(({
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
  } as unknown) as RxCollection);
  initCollections = this.initCollection;
  getCollection = jest.fn().mockReturnValue({});
  syncCollection = jest.fn().mockReturnValue({});
  syncAllCollections = jest.fn().mockReturnValue({});
  importDbDump = jest.fn().mockResolvedValue({});
  importColDump = jest.fn().mockResolvedValue({});
  // prepareCollections = jest.fn().mockResolvedValue({});
  // prepareDbDump = jest.fn().mockResolvedValue({});
}
