/* eslint-disable @typescript-eslint/ban-ts-comment */
import { getMocktRxCollection } from '@ngx-odm/rxdb/testing';
import { RxCollection } from 'rxdb';
import { RxReplicationState } from 'rxdb/plugins/replication';
import { Subject } from 'rxjs';
import { replicateKintoDB } from './replication-kinto';

const createFetchSpy = (data: any) =>
  jest.spyOn(globalThis, 'fetch').mockImplementationOnce(
    () =>
      Promise.resolve({
        headers: {
          // @ts-ignore
          get: jest.fn((header: any) => {
            if (header === 'Next-Page') {
              return undefined;
            }
            if (header === 'ETag') {
              return `"${Date.now()}"`;
            }
          }),
        },
        json: () => Promise.resolve({ data }),
        status: 200,
      }) as any
  );

(globalThis as any).fetch = window.fetch = jest.fn(
  () => Promise.resolve({}) as ReturnType<typeof window.fetch>
);

describe('replication-kinto.ts', () => {
  let collection: RxCollection;
  let kintoSyncOptions: any;

  beforeAll(async () => {
    collection = await getMocktRxCollection();
    kintoSyncOptions = {
      remote: 'https://kinto.dev.mozaws.net/v1',
      headers: {
        Authorization: 'Basic ' + btoa('user:pass'),
      },
      bucket: 'test',
      collection: 'test',
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create replicationState with default options', async () => {
    const replicationState = replicateKintoDB({
      replicationIdentifier: 'test',
      collection,
      kintoSyncOptions,
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
    // @ts-expect-error
    const [[url, { headers }]] = spy.mock.calls;
    expect(url).toEqual(expectedUrl);
    expect(headers).toMatchObject({ Authorization: expect.stringContaining('Basic') });
  });
});
