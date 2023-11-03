import type { RxDocumentData, StringKeys, WithDeleted } from 'rxdb';
import { b64EncodeUnicode, flatClone } from 'rxdb/plugins/utils';

type URLQueryParams = any;

export const KINTO_NEW_REPLICATION_PLUGIN_IDENTITY_PREFIX = 'kintodb';

export function mergeUrlQueryParams(params: URLQueryParams): string {
  return Object.entries(params)
    .filter(([_k, value]) => typeof value !== 'undefined')
    .map(([key, value]) => key + '=' + value)
    .join('&');
}

export function kintoDBDocToRxDocData<RxDocType>(
  primaryPath: string,
  kintoDocData: any
): WithDeleted<RxDocType> {
  const doc = kintoSwapIdToPrimary(primaryPath as any, kintoDocData);

  // ensure deleted flag is set.
  doc._deleted = !!doc._deleted;

  delete doc._rev;

  return doc;
}

export function kintoSwapIdToPrimary<T>(
  primaryKey: StringKeys<RxDocumentData<T>>,
  docData: any
): any {
  if (primaryKey === '_id' || docData[primaryKey]) {
    return flatClone(docData);
  }
  docData = flatClone(docData);
  docData[primaryKey] = docData._id;
  delete docData._id;

  return docData;
}

/**
 * Swaps the primaryKey of the document
 * to the _id property.
 * @param primaryKey
 * @param docData
 */
export function kintoSwapPrimaryToId<RxDocType>(
  primaryKey: StringKeys<RxDocumentData<RxDocType>>,
  docData: any
): RxDocType & { _id: string } {
  // optimisation shortcut
  if (primaryKey === '_id') {
    return docData;
  }

  const idValue = docData[primaryKey];
  const ret = flatClone(docData);
  delete ret[primaryKey];
  ret._id = idValue;
  return ret;
}

export function getDefaultFetch() {
  if (typeof window === 'object' && (window as any)['fetch']) {
    /**
     * @see https://stackoverflow.com/a/47180009/3443137
     */
    return window.fetch.bind(window);
  } else {
    return fetch;
  }
}

/**
 * Returns a fetch handler that contains the username and password
 * in the Authorization header
 * @param username
 * @param password
 */
export function getFetchWithCouchDBAuthorization(
  username: string,
  password: string
): typeof fetch {
  const ret: typeof fetch = (url, options) => {
    options = Object.assign({}, options);
    if (!options.headers) {
      options.headers = {};
    }
    (options as any).headers['Authorization'] =
      'Basic ' + b64EncodeUnicode(username + ':' + password);
    return fetch(url, options);
  };
  return ret;
}
