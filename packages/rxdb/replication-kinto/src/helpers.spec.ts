import { aggregate, kintoCollectionFactory } from './helpers';
import {
  KintoCollectionSyncOptions,
  KintoReplicationStrategy,
  KintoRequest,
} from './types';

const requestDefaults = {
  safe: false,
  headers: {},
  patch: false,
};

function createRequest(
  path: string,
  { data, permissions }: any,
  options: any = {}
): KintoRequest {
  const { headers } = {
    ...requestDefaults,
    ...options,
  } as any;
  const method = options.method || (data && data.id) ? 'PUT' : 'POST';
  return {
    method,
    path,
    headers: { ...headers },
    body: { data, permissions },
  };
}

describe('helpers', () => {
  describe('aggregate()', () => {
    it("should throw if responses length doesn't match requests one", () => {
      const resp = {
        status: 200,
        path: '/sample',
        body: { data: {} },
        headers: {},
      };
      const req = createRequest('foo', {
        data: { id: 1 },
      });
      expect(() => aggregate([resp], [req, req])).toThrowError();
    });

    it('should return an object', () => {
      expect(aggregate([], [])).toBeInstanceOf(Object);
    });

    it('should return an object with the expected keys', () => {
      expect(aggregate([], [])).toMatchObject({
        published: expect.any(Array),
        conflicts: expect.any(Array),
        skipped: expect.any(Array),
        errors: expect.any(Array),
      });
    });

    it('should expose HTTP 200<=x<400 responses in the published list', () => {
      const _requests = [
        createRequest('foo', { data: { id: 1 } }),
        createRequest('foo', { data: { id: 2 } }),
      ];
      const responses = [
        { status: 200, body: { data: { id: 1 } }, path: '/foo', headers: {} },
        { status: 201, body: { data: { id: 2 } }, path: '/foo', headers: {} },
      ];

      expect(aggregate(responses, _requests)).toMatchObject({
        published: responses.map(r => r.body),
      });
    });

    it('should expose HTTP 404 responses in the skipped list', () => {
      const _requests = [
        createRequest('records/123', { data: { id: 1 } }),
        createRequest('records/123', { data: { id: 1 } }),
      ];
      const responses = [
        {
          status: 404,
          body: { errno: 110, code: 404, error: 'Not found' },
          path: 'records/123',
          headers: {},
        },
        {
          status: 404,
          body: { errno: 110, code: 404, error: 'Not found' },
          path: 'records/123',
          headers: {},
        },
      ];

      expect(aggregate(responses, _requests)).toMatchObject({
        skipped: responses.map(r => ({
          id: '123',
          path: 'records/123',
          error: r.body,
        })),
      });
    });

    it('should expose HTTP 412 responses in the conflicts list', () => {
      const _requests = [
        createRequest('records/123', { data: { id: 1 } }),
        createRequest('records/123', { data: { id: 2 } }),
      ];
      const responses = [
        {
          status: 412,
          body: { details: { existing: { last_modified: 0, id: '1' } } },
          path: 'records/123',
          headers: {},
        },
        { status: 412, body: {}, path: 'records/123', headers: {} },
      ];

      expect(aggregate(responses, _requests)).toMatchObject({
        conflicts: [
          {
            type: 'outgoing',
            local: _requests[0].body,
            remote: { last_modified: 0, id: '1' },
          },
          {
            type: 'outgoing',
            local: _requests[1].body,
            remote: null,
          },
        ],
      });
    });
  });
  describe('kintoCollection', () => {
    const headers = { Authorization: 'Basic u:p' };
    const options: KintoCollectionSyncOptions = {
      remote: 'https://example.com',
      bucket: 'test-bucket',
      collection: 'test-collection',
      headers,
      retry: 3,
      exclude: undefined, // [{ id: '1' }, { id: '2' }],
      expectedTimestamp: undefined,
      strategy: KintoReplicationStrategy.MANUAL,
    };

    const mockFetch = jest.fn();
    const kintoCollection = kintoCollectionFactory(options, mockFetch);

    beforeEach(() => {
      mockFetch.mockClear();
    });

    describe('collection info', () => {
      it('should call fetch with the correct URL and headers', async () => {
        mockFetch.mockResolvedValueOnce({
          json: jest.fn().mockResolvedValueOnce({}),
        });

        await kintoCollection.info();

        expect(mockFetch).toHaveBeenCalledWith(
          `${options.remote}/buckets/${options.bucket}/collections/${options.collection}`,
          { headers }
        );
      });
    });

    describe('list records (changes)', () => {
      it('should call fetch with the correct URL, headers, and filters', async () => {
        mockFetch.mockResolvedValueOnce({
          json: jest.fn().mockResolvedValueOnce({ data: [] }),
          headers: new Map([
            ['Next-Page', ''],
            ['ETag', '"1698404710931"'],
          ]),
        });

        await kintoCollection.listRecords({});

        expect(mockFetch).toHaveBeenCalledWith(
          `${options.remote}/buckets/${options.bucket}/collections/${options.collection}/records?_sort=-last_modified`,
          { headers }
        );
      });
    });

    describe('batch requests', () => {
      it('should not call for empty changes', async () => {
        await kintoCollection.batch([]);
        expect(mockFetch).not.toHaveBeenCalled();
      });

      it('should call fetch with the correct URL, headers, and body for UPDATEs', async () => {
        mockFetch.mockResolvedValueOnce({
          json: jest.fn().mockResolvedValueOnce({ responses: [], requests: [] }),
        });

        await kintoCollection.batch([
          {
            title: 'test update',
            id: '06ed7f01-d10c-4ce5-a90b-ba51daa818a4',
            last_modified: 1700211090879,
            deleted: false,
          },
        ]);

        expect(mockFetch).toHaveBeenCalledWith(`${options.remote}/batch`, {
          headers,
          method: 'POST',
          body: JSON.stringify({
            defaults: { headers },
            requests: [
              {
                method: 'PATCH',
                path: `/buckets/${options.bucket}/collections/${options.collection}/records/06ed7f01-d10c-4ce5-a90b-ba51daa818a4`,
                headers: { 'If-Match': `"${1700211090879}"` },
                body: {
                  data: {
                    title: 'test update',
                    id: '06ed7f01-d10c-4ce5-a90b-ba51daa818a4',
                    deleted: false,
                  },
                },
              },
            ],
          }),
        });
      });
    });
  });
});
