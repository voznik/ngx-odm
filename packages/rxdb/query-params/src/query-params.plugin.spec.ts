/* eslint-disable @typescript-eslint/no-unused-vars */
/* @typescript-eslint/no-non-null-assertion */
import { RxCollectionExtended as RxCollection } from '@ngx-odm/rxdb/config';
import {
  TEST_FEATURE_CONFIG_1,
  TestDocType,
  getMockRxCollection,
} from '@ngx-odm/rxdb/testing';
import type { MangoQuery, RxCollectionCreator, RxPlugin, RxQuery } from 'rxdb';
import { Observable, Subject, firstValueFrom, of, take } from 'rxjs';
import { RxDBPUseQueryParamsPlugin } from './query-params.plugin';

describe('RxDBPUseQueryParamsPlugin', () => {
  describe('test proto extension', () => {
    let collection: RxCollection;
    let creator: RxCollectionCreator;
    let plugin: RxPlugin;
    const mockUrlStream$ = new Subject<string>();

    beforeEach(async () => {
      const colConfig = TEST_FEATURE_CONFIG_1;
      colConfig.options.useQueryParams = true;
      plugin = RxDBPUseQueryParamsPlugin;
      collection = (await getMockRxCollection(colConfig)) as RxCollection;
    });

    it('should add properties & methods for query-params', async () => {
      expect(collection.queryParams$).toBeInstanceOf(Observable);
      expect(collection.queryParamsInit).toBeDefined();
      expect(collection.queryParamsSet).toBeDefined();
      expect(collection.queryParamsPatch).toBeDefined();
    });

    it('should properly intialize usage of query-params', async () => {
      const startUrl =
        'http://localhost:4200/todos?limit=1&selector=%7B%22completed%22:%7B%22$eq%22:true%7D%7D&sort=%5B%7B%22createdAt%22:%22desc%22%7D%5D';
      collection.queryParamsInit(mockUrlStream$, jest.fn());
      mockUrlStream$.next(startUrl);
      const expectedQueryParams = {
        selector: {
          completed: {
            $eq: true,
          },
        },
        sort: [{ createdAt: 'desc' }],
        limit: 1,
        skip: undefined,
      };
      const queryParamsValue = await collection.queryParams$.pipe(take(1)).toPromise();
      expect(queryParamsValue).toEqual(expectedQueryParams);
    });
    it('should properly set query-params', async () => {
      const nextUrl =
        'http://localhost:4200/todos?limit=2&sort=%5B%7B%22createdAt%22:%22asc%22%7D%5D&skip=0';

      collection.queryParamsInit(mockUrlStream$, jest.fn());
      const newQueryParams: MangoQuery<TestDocType> = {
        selector: undefined,
        sort: [{ createdAt: 'asc' }],
        limit: 2,
        skip: 0,
      };
      collection.queryParamsSet(newQueryParams);
      mockUrlStream$.next(nextUrl);
      const queryParamsValue = await collection.queryParams$.pipe(take(1)).toPromise();
      expect(queryParamsValue).toEqual(newQueryParams);
    });
    it('should properly patch query-params', async () => {
      const startUrl = 'http://localhost:4200/todos?limit=0';
      const nextUrl = 'http://localhost:4200/todos?limit=1&skip=1';
      mockUrlStream$.next(startUrl);
      collection.queryParamsInit(mockUrlStream$, jest.fn());
      const newQueryParams: MangoQuery<TestDocType> = {
        limit: 1,
        skip: 1,
      };
      collection.queryParamsPatch(newQueryParams);
      mockUrlStream$.next(nextUrl);
      const queryParamsValue = await collection.queryParams$.pipe(take(1)).toPromise();
      expect(queryParamsValue).toMatchObject(newQueryParams);
    });
  });
});
