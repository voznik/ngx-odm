import { RxStorage } from 'rxdb';
import { getRxDatabaseCreator } from './config';

jest.mock('rxdb/plugins/storage-dexie', () => ({
  getRxStorageDexie: jest.fn(() => {
    const storage = {
      createStorageInstance: jest.fn(),
    };
    return storage;
  }),
}));
jest.mock('rxdb/plugins/storage-memory', () => ({
  getRxStorageMemory: jest.fn(() => {
    const storage = {
      createStorageInstance: jest.fn(),
    };
    return storage;
  }),
}));

describe('getRxDatabaseCreator', () => {
  it('should return a valid RxDatabaseCreator object with default storage type', () => {
    const config = {
      name: 'test-db',
      options: {
        storageType: 'unknown',
        storageOptions: {},
      },
      otherConfig: 'otherConfig',
    };
    const result = getRxDatabaseCreator(config as any);
    expect(result.storage).toMatchObject<Partial<RxStorage<any, any>>>({
      createStorageInstance: expect.any(Function),
    });
  });

  it('should return a valid RxDatabaseCreator object with dexie storage type', () => {
    const config = {
      name: 'test-db',
      options: {
        storageType: 'dexie',
        storageOptions: {},
      },
      otherConfig: 'otherConfig',
    };
    const result = getRxDatabaseCreator(config as any);
    expect(result.storage).toMatchObject<Partial<RxStorage<any, any>>>({
      createStorageInstance: expect.any(Function),
    });
  });

  it('should return a valid RxDatabaseCreator object with memory storage type', () => {
    const config = {
      name: 'test-db',
      options: {
        storageType: 'memory',
        storageOptions: {},
      },
      otherConfig: 'otherConfig',
    };
    const result = getRxDatabaseCreator(config as any);
    expect(result.storage).toMatchObject<Partial<RxStorage<any, any>>>({
      createStorageInstance: expect.any(Function),
    });
  });
});
