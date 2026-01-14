import { TEST_SCHEMA, TestDocType } from '@ngx-odm/rxdb/testing';
import { RxSchema, MangoQuery } from 'rxdb';
import { normalizeMangoQuery, parseUrlToMangoQuery } from './utils';

describe('query params utils', () => {
  const schema = new RxSchema<any>(TEST_SCHEMA, () => Promise.resolve(''));

  describe('normalizeQuery', () => {
    it('should remove fields from selector that are not in the schema', () => {
      const query: MangoQuery<TestDocType> = {
        selector: {
          completed: {
            $eq: true,
          },
          // @ts-expect-error
          unknownField: 'value',
        },
        sort: [],
        limit: 10,
        skip: 0,
      };

      const result = normalizeMangoQuery(query, schema);

      expect(result.selector).toEqual({
        completed: {
          $eq: true,
        },
      });
    });

    it('should remove sort parts that are not in the schema', () => {
      const query: MangoQuery<TestDocType> = {
        selector: {},
        sort: [{ createdAt: 'asc' }, { unknownField: 'desc' }],
        limit: 10,
        skip: 0,
      };

      const result = normalizeMangoQuery(query, schema);

      expect(result.sort).toEqual([{ createdAt: 'asc' }]);
    });

    it('should set limit and skip to undefined if they are not valid numbers', () => {
      const query: MangoQuery<TestDocType> = {
        selector: {},
        sort: [],
        limit: 'invalid',
        skip: 'invalid',
      } as any;

      const result = normalizeMangoQuery(query, schema);

      expect(result.limit).toBeUndefined();
      expect(result.skip).toBeUndefined();
    });

    // Add more test cases as needed
  });

  describe('parseUrlToMangoQuery', () => {
    it('should parse the URL and return the corresponding MangoQuery', () => {
      const url =
        'http://localhost:4200/todos?filter=ACTIVE&limit=1&selector=%7B%22completed%22:%7B%22$eq%22:true%7D%7D&sort=%5B%7B%22createdAt%22:%22desc%22%7D%5D';

      const result = parseUrlToMangoQuery(url, schema);

      expect(result).toEqual({
        selector: {
          completed: {
            $eq: true,
          },
        },
        sort: [{ createdAt: 'desc' }],
        limit: 1,
        skip: undefined,
      });
    });

    // Add more test cases as needed
  });
});
