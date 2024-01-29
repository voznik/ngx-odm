/* eslint-disable @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-explicit-any */
import {
  DEFAULT_LOCAL_DOCUMENT_ID,
  RxCollectionExtended as RxCollection,
} from '@ngx-odm/rxdb/config';
import { NgxRxdbUtils } from '@ngx-odm/rxdb/utils';
import sqs from 'query-string';
import type {
  MangoQuery,
  RxLocalDocument,
  RxPlugin,
  RxCollection as _RxCollection,
} from 'rxdb';
import { distinctUntilChanged, exhaustMap, map } from 'rxjs';

type LocalDocument<T = any> = MangoQuery<T> & {
  filter?: string;
  qp: string;
};

export const RxDBPUseQueryParamsPlugin: RxPlugin = {
  name: 'use-query-parmas-plugin',
  rxdb: true,
  prototypes: {
    RxCollection: (proto: _RxCollection) => {
      const getLatesData = (doc: RxLocalDocument<any> | null): LocalDocument =>
        doc?.toJSON().data ?? ({} as LocalDocument);
      const toValidLimit = (limit: unknown) => {
        if (NgxRxdbUtils.isNullOrUndefined(limit)) {
          return undefined;
        }
        if (isNaN(limit as number)) {
          return undefined;
        }
        return limit;
      };
      const queryParams = async function (
        this: RxCollection,
        updateLocationFn: (queryParams: any) => Promise<any> = () => Promise.resolve()
      ) {
        /* const serializedQuery = stringify(
          {
            selector: {
              _deleted: { $eq: false },
              last_modified: {
                $gt: 0,
                $lte: 1629780000000,
              },
            },
            sort: [{ last_modified: 'asc' }, { createdAt: 'desc' }],
          },
          {
            allowDots: true,
            encodeValuesOnly: true,
            strictNullHandling: true,
            indices: false,
          }
        );
        console.debug(serializedQuery);
        const deserializedQuery = parse(serializedQuery, {
          allowDots: true,
          strictNullHandling: true,
        });
        console.debug(deserializedQuery);
        const defaultQuery = stringify(
          {
            selector: {},
            sort: [],
          },
          {
            allowDots: true,
            encodeValuesOnly: true,
            indices: false,
            skipNulls: false,
          }
        ); */
        const qp = sqs.extract(location.href);
        const parsed = sqs.parse(qp, {
          parseNumbers: true,
          parseBooleans: true,
        });
        const {
          filter,
          selector: _selector,
          sort: _sort,
          limit: _limit,
          skip: _skip,
        } = parsed;
        const selector = JSON.parse((_selector ?? `{"_deleted":{"$eq":false}}`) as string);
        const sort = JSON.parse((_sort ?? `[{"createdAt":"desc"}]`) as string);
        const limit = toValidLimit(_limit);
        const skip = toValidLimit(_skip);
        let local = await this.getLocal<LocalDocument>(DEFAULT_LOCAL_DOCUMENT_ID);
        let data = getLatesData(local);
        // const _dqp = `&selector=%7B"_deleted":%7B"$eq":false%7D%7D&sort=%5B%7B"createdAt":"desc"%7D%5D`;
        if (
          !local ||
          NgxRxdbUtils.isUndefined(data?.selector) ||
          JSON.stringify(data.selector) !== _selector ||
          NgxRxdbUtils.isUndefined(data?.sort) ||
          JSON.stringify(data.sort) !== _sort ||
          NgxRxdbUtils.isUndefined(data?.limit) ||
          data.limit !== limit ||
          NgxRxdbUtils.isUndefined(data?.skip) ||
          data.skip !== skip
        ) {
          local = await this.upsertLocal<LocalDocument>(DEFAULT_LOCAL_DOCUMENT_ID, {
            ...data,
            ...({
              selector,
              sort,
              limit,
              skip,
            } as any),
          });
          data = getLatesData(local);
        }
        const str = sqs.stringify({ filter, limit, skip });
        NgxRxdbUtils.logger.log('queryParams:data', data, str);
        // NgxRxdbUtils.logger.log('queryParams:router:url', router.url);
        // NgxRxdbUtils.logger.log('queryParams:router:queryParams', routerQueryParams);
        NgxRxdbUtils.logger.log('queryParams:parsed', parsed, qp);

        local.$.pipe(
          map(getLatesData),
          distinctUntilChanged(),
          exhaustMap((data: LocalDocument) => {
            const { filter, selector, sort, limit, skip } = data;
            return updateLocationFn!({
              filter,
              selector: JSON.stringify(selector),
              sort: JSON.stringify(sort),
              limit,
              skip,
            });
          })
        ).subscribe(changeEvent => {
          NgxRxdbUtils.logger.log('queryParams:changeEvent', changeEvent);
        });
        ////////
        /* return {
          queryParamsGet: (path?: keyof LocalDocument) => {
            if (!this.options?.persistLocalToURL) {
              return;
            }
            const ldata = getLatesData(local);
            if (path) {
              return getProperty(ldata, path);
            }
            return ldata;
          },
          queryParamsSet: async (path: keyof LocalDocument, value: any) => {
            if (!this.options?.persistLocalToURL) {
              return;
            }
            let ldata = getLatesData(local);
            const ndata = setProperty(ldata, path, value);
            await local?.incrementalPatch(ndata);
            await updateLocationFn?.(ndata);
            location.search = sqs.stringify(ndata);
            ldata = getLatesData(local);
            NgxRxdbUtils.logger.log('queryParams:set', ndata);
          },
        }; */
      };
      Object.assign(proto, {
        queryParams,
      });
    },
  },
  hooks: {
    createRxCollection: {
      after: async ({ collection }) => {
        if (!collection.options?.persistLocalToURL) {
          return;
        }

        NgxRxdbUtils.logger.log('queryParams:createRxCollection:after');
      },
    },
  },
};
