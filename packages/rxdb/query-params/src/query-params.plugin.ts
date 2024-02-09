/* eslint-disable @typescript-eslint/no-namespace, @typescript-eslint/no-unused-vars, @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any */
import {
  MangoQueryParams,
  RxCollectionExtended as RxCollection,
} from '@ngx-odm/rxdb/config';
import { NgxRxdbUtils } from '@ngx-odm/rxdb/utils';
import type { MangoQuery, RxPlugin, RxCollection as _RxCollection } from 'rxdb';
import {
  BehaviorSubject,
  EMPTY,
  Observable,
  catchError,
  distinctUntilChanged,
  map,
  of,
  takeWhile,
  tap,
} from 'rxjs';
import { parseUrlToMangoQuery } from './utils';

const DEFAULT_SELECTOR = `{}`; // `{"_deleted":{"$eq":false}}`
const DEFAULT_SORT = `[]`; // [{"createdAt":"desc"}]`;

const { debug } = NgxRxdbUtils;

const _queryParams$ = new BehaviorSubject<MangoQuery<any>>({} as any);

export const RxDBPUseQueryParamsPlugin: RxPlugin = {
  name: 'query-params-plugin',
  rxdb: true,
  prototypes: {
    RxCollection: (proto: _RxCollection) => {
      let initDone = false;
      let currentUrl = '';
      let currentUrl$: Observable<string> = EMPTY;
      let updateQueryParamsInLocationFn: (
        queryParams: MangoQueryParams
      ) => Promise<boolean> = () => Promise.resolve(false);
      //
      function init(
        this: RxCollection,
        _currentUrl$: Observable<string>,
        _updateQueryParamsInLocationFn: (queryParams: MangoQueryParams) => Promise<any>
      ): void {
        if (!this.options?.useQueryParams || initDone) return;
        currentUrl$ = _currentUrl$;
        updateQueryParamsInLocationFn = _updateQueryParamsInLocationFn;

        currentUrl$
          .pipe(
            distinctUntilChanged(),
            tap(url => (currentUrl = url)),
            map(url => parseUrlToMangoQuery(url, this.schema)),
            catchError(err =>
              of({
                selector: JSON.parse(DEFAULT_SELECTOR),
                sort: JSON.parse(DEFAULT_SORT),
                limit: undefined,
                skip: 0,
              })
            ),
            debug('queryParams:'),
            takeWhile(() => !this.destroyed)
          )
          .subscribe(_queryParams$);

        initDone = true;
      }
      function set(this: RxCollection, query: MangoQuery): void {
        if (!this.options?.useQueryParams) return;
        const { selector, sort, limit, skip } = query;
        const queryParams: MangoQueryParams = { limit, skip };
        if (selector) {
          queryParams.selector = JSON.stringify(query.selector);
        }
        if (sort) {
          queryParams.sort = JSON.stringify(query.sort);
        }
        updateQueryParamsInLocationFn(queryParams);
      }
      function patch(this: RxCollection, query: MangoQuery): void {
        if (!this.options?.useQueryParams) return;
        const parsed = parseUrlToMangoQuery(currentUrl, this.schema);
        const queryParams: MangoQueryParams = {
          selector: JSON.stringify(query.selector || parsed.selector),
          sort: JSON.stringify(query.sort || parsed.sort),
          limit: query.limit || parsed.limit,
          skip: query.skip || parsed.skip,
        };
        updateQueryParamsInLocationFn(queryParams);
      }

      Object.assign(proto, {
        queryParams$: _queryParams$.asObservable(),
        queryParamsInit: init,
        queryParamsSet: set,
        queryParamsPatch: patch,
      });
    },
  },
  hooks: {
    createRxCollection: {
      // TODO: because plugin initialization needs dependecnies, ATM we cannot initialize with hook
    },
  },
};
