/* eslint-disable @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any */
import { NgxRxdbUtils } from '@ngx-odm/rxdb/utils';
import { includeKeys } from 'filter-obj';
import queryString from 'query-string';
import type { MangoQuery, MangoQuerySelector, MangoQuerySortPart, RxSchema } from 'rxdb';

const { keys, isEmpty, isNullOrUndefined } = NgxRxdbUtils;

/**
 * Ensure that all top level fields are included in the schema.
 * Ensure that sort only runs on known fields
 * @param schema
 */
export const normalizeMangoQuery = (
  { selector, sort, limit, skip }: MangoQuery<any>,
  schema: RxSchema<any>
): MangoQuery<any> => {
  const schemaTopLevelFields = keys(schema.jsonSchema.properties);
  if (!isEmpty(selector)) {
    selector = includeKeys(selector as Record<string, any>, key => {
      return (
        !key.startsWith('$') && // do not check operators
        !key.includes('.') && // skip this check on non-top-level
        schemaTopLevelFields.includes(key) // included in the schema
      );
    });
  }
  if (!isEmpty(sort)) {
    sort = sort?.filter(sortPart => schemaTopLevelFields.includes(keys(sortPart)[0]));
  }

  if (isNullOrUndefined(limit) || isNaN(limit as number)) {
    limit = undefined;
  }
  if (isNullOrUndefined(skip) || isNaN(skip as number)) {
    skip = undefined;
  }

  return { selector, sort, limit, skip };
};

export const parseUrlToMangoQuery = (url: string, schema: RxSchema): MangoQuery<any> => {
  url = queryString.extract(url);
  const urlPart = queryString.pick(url, ['selector', 'sort', 'limit', 'skip']);
  const parsed: any = queryString.parse(urlPart, {
    parseNumbers: true,
    parseBooleans: true,
  });
  const { selector: _selector, sort: _sort, limit, skip } = parsed;
  const selector = _selector ? JSON.parse(_selector as string) : undefined;
  const sort = _sort ? JSON.parse(_sort as string) : undefined;
  /** Ensure that all top level fields are included in the schema. */
  const queryObj: MangoQuery<any> = normalizeMangoQuery(
    {
      selector,
      sort,
      limit,
      skip,
    },
    schema
  );
  return queryObj;
};

export const stringifyParam = (
  param: MangoQuerySelector<any> | MangoQuerySortPart<any>[] | undefined
): string => {
  if (isNullOrUndefined(param)) return '';
  return JSON.stringify(param);
};
