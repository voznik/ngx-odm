import {
  MangoQueryParams,
  RxCollectionExtended as RxCollection,
} from '@ngx-odm/rxdb/config';
import { NgxRxdbUtils } from '@ngx-odm/rxdb/utils';
import type { MangoQuery, RxPlugin, RxSchema, RxCollection as _RxCollection } from 'rxdb';
import {
  BehaviorSubject,
  EMPTY,
  Observable,
  catchError,
  distinctUntilChanged,
  map,
  takeWhile,
  tap,
} from 'rxjs';
import { parseUrlToMangoQuery, stringifyParam } from './utils';

const { logger, compactObject } = NgxRxdbUtils;

export const RxDBPUseQueryParamsPlugin: RxPlugin = {
  name: 'query-params-plugin',
  rxdb: true,
  prototypes: {
    RxCollection: (proto: _RxCollection) => {
      const _queryParams$ = new BehaviorSubject<MangoQuery<any>>({} as any);
      let useQueryParams = false;
      let schema: RxSchema;
      let initDone = false;
      let currentUrl = '';
      let updateQueryParamsInLocationFn: (
        queryParams: MangoQueryParams
      ) => Promise<boolean> = () => Promise.resolve(false);
      //
      function init(
        this: RxCollection,
        currentUrl$: Observable<string> = EMPTY,
        _updateQueryParamsInLocationFn: (queryParams: MangoQueryParams) => Promise<any>
      ): void {
        useQueryParams = !!this.options?.useQueryParams;
        schema = this.schema;

        if (!useQueryParams || initDone) {
          return;
        }
        updateQueryParamsInLocationFn = _updateQueryParamsInLocationFn;

        currentUrl$
          .pipe(
            distinctUntilChanged(),
            tap(url => {
              currentUrl = url;
            }),
            map(url => parseUrlToMangoQuery(url, schema)),
            catchError(err => {
              logger.log('Error in parsing url to mango query', err);
              return _queryParams$;
            }),
            tap(queryParams => {
              logger.log('queryParams', queryParams);
            }),
            takeWhile(() => !this.destroyed)
          )
          .subscribe(_queryParams$);

        initDone = true;
      }
      function set(query: MangoQuery): void {
        if (!useQueryParams) {
          return;
        }
        const { selector, sort, limit, skip } = query;
        const queryParams: MangoQueryParams = { limit, skip };
        if (selector) {
          queryParams.selector = stringifyParam(query.selector);
        }
        if (sort) {
          queryParams.sort = stringifyParam(query.sort);
        }
        updateQueryParamsInLocationFn(queryParams);
      }
      function patch(query: MangoQuery): void {
        if (!useQueryParams) {
          return;
        }
        const parsed = parseUrlToMangoQuery(currentUrl, schema);
        const queryParams: MangoQueryParams = {
          selector: stringifyParam(query.selector || parsed.selector),
          sort: stringifyParam(query.sort || parsed.sort),
          limit: query.limit || parsed.limit,
          skip: query.skip || parsed.skip,
        };
        updateQueryParamsInLocationFn(compactObject(queryParams));
      }

      Object.assign(
        proto,
        {
          queryParams: {
            $: _queryParams$.asObservable(),
            get: () => _queryParams$.getValue(),
            set,
            patch,
          },
        },
        {
          queryParamsInit: init,
        }
      );
    },
  },
  hooks: {
    createRxCollection: {
      // TODO: because plugin initialization needs dependecnies, ATM we cannot initialize with hook
    },
  },
};
