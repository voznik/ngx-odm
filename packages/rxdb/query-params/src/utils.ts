/* eslint-disable @typescript-eslint/no-namespace, @typescript-eslint/no-unused-vars, @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any */
import { NgxRxdbUtils } from '@ngx-odm/rxdb/utils';
import sqs from 'query-string';
import type { MangoQuery, RxSchema } from 'rxdb';

const { keys, isEmpty, isNullOrUndefined } = NgxRxdbUtils;

/**
 * Ensure that all top level fields are included in the schema.
 * Ensure that sort only runs on known fields
 * @param schema
 */
export const normalizeQuery = (
  { selector, sort, limit, skip }: MangoQuery<any>,
  schema: RxSchema<any>
): MangoQuery<any> => {
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
        return normalizeQuery({ selector, sort }, schema);
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
        return normalizeQuery({ selector, sort }, schema);
      }
    });

  if (isNullOrUndefined(limit) || isNaN(limit as number)) {
    limit = undefined;
  }
  if (isNullOrUndefined(skip) || isNaN(skip as number)) {
    skip = undefined;
  }

  return { selector, sort, limit, skip };
};

export const parseUrlToMangoQuery = (url: string, schema: RxSchema): MangoQuery<any> => {
  url = sqs.extract(url);
  const urlPart = sqs.pick(url, ['selector', 'sort', 'limit', 'skip']);
  const parsed: any = sqs.parse(urlPart, {
    parseNumbers: true,
    parseBooleans: true,
  });
  const { selector: _selector, sort: _sort, limit, skip } = parsed;
  const selector = _selector ? JSON.parse(_selector as string) : undefined;
  const sort = _sort ? JSON.parse(_sort as string) : undefined;
  /** Ensure that all top level fields are included in the schema. */
  const queryObj: MangoQuery<any> = normalizeQuery(
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
