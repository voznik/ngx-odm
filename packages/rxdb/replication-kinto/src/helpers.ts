/* eslint-disable @typescript-eslint/no-explicit-any */
import { NgxRxdbUtils, getDefaultFetch } from '@ngx-odm/rxdb/utils';
import { deepEqual, type RxConflictHandlerInput, type RxConflictHandlerOutput } from 'rxdb';
import {
  KintoAggregateResponse,
  KintoBatchResponse,
  KintoCollectionSyncOptions,
  KintoListParams,
  KintoOperationResponse,
  KintoPaginatedParams,
  KintoPaginationResult,
  KintoReplicationStrategy,
  KintoRequest,
} from './types';

export const DEFAULT_KINTO_SYNC_OPTIONS: KintoCollectionSyncOptions = {
  remote: '/',
  bucket: undefined,
  collection: undefined,
  headers: undefined,
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

export function conflictHandlerKinto({
  newDocumentState: local,
  realMasterState: remote,
}: RxConflictHandlerInput<any>): Promise<RxConflictHandlerOutput<any>> {
  if (deepEqual(local, remote)) {
    return Promise.resolve({
      isEqual: true,
    });
  }
  return Promise.resolve({
    isEqual: false,
    documentData: remote,
  });
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
  const results: KintoAggregateResponse = {
    errors: [],
    published: [],
    conflicts: [],
    skipped: [],
  };
  return responses.reduce((acc, response, index) => {
    const { status } = response;
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

export function kintoCollectionFactory(
  {
    remote,
    bucket,
    collection: collectionName,
    headers,
    retry,
    exclude,
    expectedTimestamp,
    strategy,
  }: KintoCollectionSyncOptions,
  fetch = getDefaultFetch()
) {
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
  const collectionUrl = `buckets/${bucket}/collections/${collectionName}/records`;
  return {
    async listRecords(options: KintoPaginatedParams): Promise<KintoPaginationResult<any>> {
      const { ...query } = options;
      const url = addEndpointOptions(`${remote}/${collectionUrl}`, { query });
      const response = await fetch(url, { headers });
      const etag = response.headers.get('ETag');
      // ETag header values are quoted (because of * and W/"foo").
      const last_modified = etag ? etag.replace(/"/g, '') : etag;
      const { data } = await response.json();
      NgxRxdbUtils.logger.log('replication:kinto:since', response.status, last_modified);
      return {
        data,
        last_modified,
      };
    },
    async batch({
      toCreate = [],
      toUpdate = [],
      toDelete = [],
    }: {
      toDelete: any[];
      toCreate: any[];
      toUpdate: any[];
    }): Promise<KintoOperationResponse<any>[] | KintoAggregateResponse> {
      const safe = !strategy || strategy !== undefined;
      const body = {
        defaults: { headers },
        requests: [
          // CREATE
          ...toCreate.map(({ last_modified, ...data }) => ({
            method: 'PUT',
            path: `/${collectionUrl}/${data.id}`,
            headers: { 'If-None-Match': '*' },
            body: { data },
          })),
          // UPDATE
          ...toUpdate.map(({ last_modified, ...data }) => ({
            method: 'PUT',
            path: `/${collectionUrl}/${data.id}`,
            headers: { 'If-Match': `"${last_modified}"` },
            body: { data },
          })),
          // DELETE
          ...toDelete.map(({ id, last_modified, ...data }) => ({
            method: 'PUT',
            path: `/${collectionUrl}/${id}`,
            headers: { 'If-Match': `"${last_modified}"` },
            body: { data: { id, deleted: true } },
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
