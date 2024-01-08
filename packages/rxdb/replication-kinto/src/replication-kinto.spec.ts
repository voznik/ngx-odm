import { getMockRxCollection } from '@ngx-odm/rxdb/testing';
import type { RxCollection } from 'rxdb';
import { RxReplicationState } from 'rxdb/plugins/replication';
import { replicateKintoDB } from './replication-kinto';
import { KintoCollectionSyncOptions } from './types';

describe('replication:kinto', () => {
  let collection: RxCollection;
  let kintoSyncOptions: KintoCollectionSyncOptions;
  const mockFetch = jest.fn(() => Promise.resolve({} as ReturnType<typeof window.fetch>));
  const createFetchSpy = (data: any, ok = true) =>
    mockFetch.mockResolvedValueOnce({
      ok,
      json: jest.fn().mockResolvedValueOnce({ data }),
      headers: new Map([
        ['Next-Page', ''],
        ['ETag', '"1698404710931"'],
      ]),
    } as any);

  beforeAll(async () => {
    collection = await getMockRxCollection();
    kintoSyncOptions = {
      remote: 'https://kinto.dev.mozaws.net/v1',
      bucket: 'test',
      collection: 'test',
    };
  });

  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should create replicationState with default options', async () => {
    const replicationState = replicateKintoDB({
      replicationIdentifier: 'test',
      collection,
      kintoSyncOptions,
      fetch: mockFetch,
      live: false,
      autoStart: false,
    });
    expect(replicationState).toBeInstanceOf(RxReplicationState);
    expect(replicationState.start).toBeInstanceOf(Function);
    expect(replicationState.isStopped()).toBeFalsy();
  });

  it('should start pull replication', async () => {
    const replicationState = replicateKintoDB({
      replicationIdentifier: 'test',
      kintoSyncOptions,
      collection,
      pull: {
        batchSize: 100,
        modifier: doc => doc,
      },
      retryTime: 5000,
      live: false,
      autoStart: false,
      waitForLeadership: true,
    });
    expect(replicationState).toBeDefined();
    const spy = createFetchSpy([]);
    await replicationState.start();
    const expectedUrl =
      'https://kinto.dev.mozaws.net/v1/buckets/test/collections/test/records?_limit=100&_sort=-last_modified';
    const [[url]] = spy.mock.calls as any[][];
    expect(url).toEqual(expectedUrl);
  });
});
