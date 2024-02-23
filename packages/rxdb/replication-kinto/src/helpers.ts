/* eslint-disable @typescript-eslint/no-explicit-any */
import { NgxRxdbUtils, getDefaultFetch } from '@ngx-odm/rxdb/utils';
// import { deepEqual, type RxConflictHandlerInput, type RxConflictHandlerOutput } from 'rxdb';
import {
  KintInfoResponse,
  KintoAggregateResponse,
  KintoBatchResponse,
  KintoCollectionSyncOptions,
  KintoListParams,
  KintoPaginatedParams,
  KintoPaginationResult,
  KintoReplicationStrategy,
  KintoRequest,
} from './types';

export const DEFAULT_KINTO_SYNC_OPTIONS: KintoCollectionSyncOptions = {
  remote: '/',
  bucket: 'default',
  collection: 'default',
  headers: {},
  exclude: undefined,
  expectedTimestamp: undefined,
  timeout: undefined,
  heartbeat: 60000,
  strategy: KintoReplicationStrategy.CLIENT_WINS,
};

export const DEFAULT_REPLICATION_OPTIONS = {
  kintoSyncOptions: DEFAULT_KINTO_SYNC_OPTIONS,
  live: true,
  retryTime: 1000 * 5,
  waitForLeadership: true,
  autoStart: true,
};

export function assignLastModified(doc: any, last_modified: number, force = false) {
  if (!doc.last_modified || force) {
    doc.last_modified = last_modified;
  }
  return doc;
}

/**
 * Handle common query parameters for Kinto requests.
 * @param  {string}  [path]  The endpoint base path.
 * @param  {Array}   [options.fields]    Fields to limit the
 *   request to.
 * @param  {object}  [options.query={}]  Additional query arguments.
 */
export function addEndpointOptions(
  path: string,
  options: { fields?: string[]; query?: { [key: string]: any } } = {}
): string {
  const query: { [key: string]: any } = { ...options.query };
  if (options.fields) {
    query._fields = options.fields;
  }
  const queryString = qsify(query);
  if (queryString) {
    return path + '?' + queryString;
  }
  return path;
}

/**
 * Clones an object with all its undefined keys removed.
 * @private
 */
export function cleanUndefinedProperties(obj: { [key: string]: any }): {
  [key: string]: any;
} {
  const result: { [key: string]: any } = {};
  for (const key in obj) {
    if (typeof obj[key] !== 'undefined') {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Transforms an object into an URL query string, stripping out any undefined
 * values.
 * @param  {object} obj
 * @returns {string}
 */
export function qsify(obj: { [key: string]: any }): string {
  const encode = (v: any): string =>
    encodeURIComponent(typeof v === 'boolean' ? String(v) : v);
  const stripped = cleanUndefinedProperties(obj);
  return Object.keys(stripped)
    .map(k => {
      const ks = encode('_' + k) + '=';
      if (Array.isArray(stripped[k])) {
        return ks + stripped[k].map((v: any) => encode(v)).join(',');
      }
      return ks + encode(stripped[k]);
    })
    .join('&');
}

/**
 * Exports batch responses as a result object.
 * @private
 * @param  {Array} responses The batch subrequest responses.
 * @param  {Array} requests  The initial issued requests.
 * @returns {object}
 */
export function aggregate(
  responses: KintoBatchResponse[] = [],
  requests: KintoRequest[] = []
): KintoAggregateResponse {
  if (responses.length !== requests.length) {
    throw new Error('Responses length should match requests one.');
  }
  let last_modified: number | undefined;
  const results: KintoAggregateResponse = {
    errors: [],
    published: [],
    conflicts: [],
    skipped: [],
    last_modified,
  };
  return responses.reduce((acc, response, index) => {
    const { status, headers } = response;
    const etag = headers?.['ETag'];
    // ETag header values are quoted (because of * and W/"foo").
    acc.last_modified = etag ? +etag.replace(/"/g, '') : undefined;
    const request = requests[index];
    if (status >= 200 && status < 400) {
      acc.published.push(response.body);
    } else if (status === 404) {
      // Extract the id manually from request path while waiting for Kinto/kinto#818
      const regex = /(buckets|groups|collections|records)\/([^/]+)$/;
      const extracts = request.path.match(regex);
      const id = extracts && extracts.length === 3 ? extracts[2] : undefined;
      acc.skipped.push({
        id,
        path: request.path,
        error: response.body,
      });
    } else if (status === 412) {
      acc.conflicts.push({
        // XXX: specifying the type is probably superfluous
        type: 'outgoing',
        local: request.body,
        remote: (response.body.details && response.body.details.existing) || null,
      });
    } else {
      acc.errors.push({
        path: request.path,
        sent: request,
        error: response.body,
      });
    }
    return acc;
  }, results);
}

export function mergeAggregatedResponse(
  obj: KintoAggregateResponse,
  next: KintoAggregateResponse
): KintoAggregateResponse {
  for (const key in next) {
    obj[key] = next[key];
  }
  return obj;
}

export function kintoCollectionFactory(
  {
    remote,
    bucket,
    collection: collectionName,
    headers,
    exclude,
    expectedTimestamp,
  }: KintoCollectionSyncOptions = DEFAULT_KINTO_SYNC_OPTIONS,
  fetch = getDefaultFetch()
) {
  const collectionUrl = `buckets/${bucket}/collections/${collectionName}`;
  // Optionally ignore some records when pulling for changes.
  let filters: KintoListParams['filters'];
  if (exclude) {
    const exclude_id = exclude
      .slice(0, 50)
      .map(r => r.id)
      .join(',');
    filters = { exclude_id };
  }
  if (expectedTimestamp) {
    filters = {
      ...filters,
      _expected: expectedTimestamp,
    };
  }
  return {
    async info(): Promise<KintInfoResponse> {
      const response = await fetch(`${remote}/${collectionUrl}`, { headers });
      return response.json();
    },
    async listRecords(options: KintoPaginatedParams): Promise<KintoPaginationResult<any>> {
      const { ...query } = options;
      if (filters) {
        query.filters = filters;
      }
      if (!query.sort) {
        query.sort = '-last_modified';
      }
      const url = addEndpointOptions(`${remote}/${collectionUrl}/records`, { query });
      const response = await fetch(url, { headers });
      const nextPage = response.headers.get('Next-Page');
      const etag = response.headers.get('ETag');
      // ETag header values are quoted (because of * and W/"foo").
      const last_modified = etag ? etag.replace(/"/g, '') : etag;
      const { data } = await response.json();
      NgxRxdbUtils.logger.log('replication:kinto:since', response.status, last_modified);
      return {
        data,
        hasNextPage: !!nextPage,
        last_modified,
      };
    },
    async batch(changes: any[]): Promise<KintoAggregateResponse> {
      if (!changes.length) {
        return {
          published: [],
          errors: [],
          conflicts: [],
          skipped: [],
          last_modified: undefined,
        };
      }
      const toDelete: any[] = [];
      // const safe = !strategy || strategy !== undefined; // TODO: implement similar to kinto
      const toUpdate: any[] = [];
      const toCreate: any[] = [];
      changes.forEach(doc => {
        if (doc.deleted) {
          toDelete.push(doc);
        } else if (doc.last_modified) {
          toUpdate.push(doc);
        } else {
          toCreate.push(doc);
        }
      });
      const body = {
        defaults: { headers },
        requests: [
          // https://docs.kinto-storage.org/en/stable/api/1.x/records.html#uploading-a-record
          ...toCreate.map(({ ...data }) => ({
            method: 'PUT',
            path: `/${collectionUrl}/records/${data.id}`,
            headers: { 'If-None-Match': '*' },
            body: { data },
          })),
          // https://docs.kinto-storage.org/en/stable/api/1.x/records.html#updating-a-record
          ...toUpdate.map(({ last_modified, ...data }) => ({
            method: 'PATCH',
            path: `/${collectionUrl}/records/${data.id}`,
            headers: { 'If-Match': `"${last_modified}"` },
            body: { data },
          })),
          // https://docs.kinto-storage.org/en/stable/api/1.x/records.html#deleting-a-single-record
          ...toDelete.map(({ id }) => ({
            method: 'DELETE',
            path: `/${collectionUrl}/records/${id}`,
          })),
        ],
      };

      const bodyString = JSON.stringify(body);
      const response = await fetch(`${remote}/batch`, {
        headers,
        method: 'POST',
        body: bodyString,
      });
      NgxRxdbUtils.logger.log('replication:kinto:batch', response.status);

      const { responses, requests } = await response.json();
      const result = aggregate(responses, requests || body.requests);
      return result;
    },
  };
}
