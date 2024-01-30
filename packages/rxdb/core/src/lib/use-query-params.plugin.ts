/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-explicit-any */
import { RxCollectionExtended as RxCollection } from '@ngx-odm/rxdb/config';
import { NgxRxdbUtils } from '@ngx-odm/rxdb/utils';
import sqs from 'query-string';
import {
  FilledMangoQuery,
  MangoQuerySelector,
  MangoQuerySortPart,
  RxSchema,
  type MangoQuery,
  type RxLocalDocument,
  type RxPlugin,
  type RxCollection as _RxCollection,
} from 'rxdb';
import { BehaviorSubject, Observable, catchError, map, of, takeWhile } from 'rxjs';

type LocalDocument<T = any> = MangoQuery<T> & {
  filter?: string;
  qp?: string;
};

const DEFAULT_SELECTOR = `{"_deleted":{"$eq":false}}`;
const DEFAULT_SORT = `[{"createdAt":"desc"}]`;

const { logger, keys, isEmpty, isNullOrUndefined } = NgxRxdbUtils;

export const RxDBPUseQueryParamsPlugin: RxPlugin = {
  name: 'use-query-parmas-plugin',
  rxdb: true,
  prototypes: {
    RxCollection: (proto: _RxCollection) => {
      const getLatesData = (doc: RxLocalDocument<any> | null): LocalDocument =>
        doc?.toJSON().data ?? ({} as LocalDocument);

      /**
       * Ensure that all top level fields are included in the schema.
       * Ensure that sort only runs on known fields
       * @param schema
       */
      const checkAndFixQuery = (
        { selector, sort, limit, skip }: MangoQuery<any>,
        schema: RxSchema<any>
      ): FilledMangoQuery<any> => {
        // Ensure that all top level fields are included in the schema.
        const schemaTopLevelFields = keys(schema.jsonSchema.properties);
        keys(selector)
          // do not check operators
          .filter(fieldOrOperator => !fieldOrOperator.startsWith('$'))
          // skip this check on non-top-level fields
          .filter(field => !field.includes('.'))
          .forEach(field => {
            if (!schemaTopLevelFields.includes(field)) {
              delete selector![field];
              return checkAndFixQuery({ selector, sort }, schema);
            }
          });
        // Ensure that sort only runs on known fields
        (sort ?? [])
          .map(sortPart => keys(sortPart)[0])
          .filter(field => !field.includes('.'))
          .forEach(field => {
            if (!schemaTopLevelFields.includes(field)) {
              const sortPart = sort?.[0];
              if (sortPart) {
                delete sortPart[field];
              }
              if (isEmpty(sortPart)) {
                sort = [];
              }
              return checkAndFixQuery({ selector, sort }, schema);
            }
          });

        if (isNullOrUndefined(limit) || isNaN(limit as number)) {
          limit = undefined;
        }
        if (isNullOrUndefined(skip) || isNaN(skip as number)) {
          skip = 0;
        }

        return { selector, sort, limit, skip } as FilledMangoQuery<any>;
      };

      const useQueryParams = function (
        this: RxCollection,
        currentUrl$: Observable<string>,
        updateLocationFn: (queryParams: any) => Promise<any> = () => Promise.resolve()
      ) {
        const queryObj$ = new BehaviorSubject<FilledMangoQuery<any>>({} as any);
        currentUrl$
          .pipe(
            map(url => {
              url = sqs.extract(url);
              const urlPart = sqs.pick(url, ['selector', 'sort', 'limit', 'skip']);
              const parsed: any = sqs.parse(urlPart, {
                parseNumbers: true,
                parseBooleans: true,
              });
              const { selector: _selector, sort: _sort, limit, skip } = parsed;
              const selector = JSON.parse(
                (_selector ?? DEFAULT_SELECTOR) as string
              ) as MangoQuerySelector<any>;
              const sort = JSON.parse(
                (_sort ?? DEFAULT_SORT) as string
              ) as MangoQuerySortPart<any>[];
              /** Ensure that all top level fields are included in the schema. */
              const queryObj: FilledMangoQuery<any> = checkAndFixQuery(
                {
                  selector,
                  sort,
                  limit,
                  skip,
                },
                this.schema
              );
              // logger.log('queryParams:queryObj:fixed', queryObj);
              return queryObj;
            }),
            catchError(err =>
              of({
                selector: JSON.parse(DEFAULT_SELECTOR),
                sort: JSON.parse(DEFAULT_SORT),
                limit: undefined,
                skip: 0,
              })
            ),
            takeWhile(() => !this.destroyed)
          )
          .subscribe(queryObj$);

        return {
          $: queryObj$.asObservable(),
        };
      };
      Object.assign(proto, {
        useQueryParams,
      });
    },
  },
  hooks: {
    createRxCollection: {
      after: async ({ collection }) => {
        if (!collection.options?.persistLocalToURL) {
          return;
        }

        logger.log('queryParams:createRxCollection:after');
      },
    },
  },
};
