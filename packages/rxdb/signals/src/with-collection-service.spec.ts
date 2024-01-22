import { TestBed } from '@angular/core/testing';
import { signalStore } from '@ngrx/signals';
import { withEntities } from '@ngrx/signals/entities';
import { NgxRxdbService } from '@ngx-odm/rxdb/core';
import {
  TEST_FEATURE_CONFIG_1,
  TestDocType,
  getMockRxdbService,
} from '@ngx-odm/rxdb/testing';
import { MangoQuery, RxCollection } from 'rxdb';
import { Subscription } from 'rxjs';
import {
  CollectionServiceMethods,
  CollectionServiceSignals,
  CollectionServiceState,
  withCollectionService,
} from './with-collection-service';

describe('withCollectionService', () => {
  describe('incorrect usage', () => {
    const TestStore = signalStore(
      withCollectionService({
        filter: 'any',
        collectionConfig: TEST_FEATURE_CONFIG_1,
      })
    );
    let dbService: NgxRxdbService;

    beforeEach(async () => {
      dbService = await getMockRxdbService();
      TestBed.configureTestingModule({
        providers: [
          //
          { provide: NgxRxdbService, useValue: dbService },
          TestStore,
        ],
      });
    });
    it('should return an error for store is without "withEntities"', () => {
      try {
        TestBed.inject(TestStore) as any;
      } catch (error: any) {
        expect(error.message).toMatch(`can only be used together with 'withEntities'`);
      }
    });
  });
  describe('injected', () => {
    const TestStore = signalStore(
      withEntities<TestDocType>(),
      withCollectionService({
        filter: 'any',
        collectionConfig: TEST_FEATURE_CONFIG_1,
      })
    );
    let store: CollectionServiceState<TestDocType, string> &
      CollectionServiceSignals<TestDocType> &
      CollectionServiceMethods<TestDocType, string>;
    let dbService: NgxRxdbService;
    let rxCollection: RxCollection<TestDocType>;

    beforeEach(async () => {
      dbService = await getMockRxdbService();
      TestBed.configureTestingModule({
        providers: [
          //
          { provide: NgxRxdbService, useValue: dbService },
          TestStore,
        ],
      });
      store = TestBed.inject(TestStore) as any;
      rxCollection = dbService.collections['test'];
    });
    it('should return a SignalStoreFeature', () => {
      expect(store).toBeDefined();
      expect(store.filter).toBeDefined();
      expect(store.findAllDocs).toBeInstanceOf(Function);
    });
    it('should handle method "findAllDocs" without query', () => {
      const spy = jest.spyOn(rxCollection, 'find');
      const result = store.findAllDocs();
      expect(spy).toHaveBeenCalledWith(undefined);
      expect(result).toBeInstanceOf(Subscription);
    });
    it('should handle method "findAllDocs" with query', () => {
      const query: MangoQuery<TestDocType> = {
        selector: {},
        sort: [{ createdAt: 'desc' }],
      };
      const spy = jest.spyOn(rxCollection, 'find');
      const result = store.findAllDocs(query);
      expect(spy).toHaveBeenCalledWith(query);
      expect(result).toBeInstanceOf(Subscription);
    });

    // TODO: Add more test cases for the different methods and functionalities of withCollectionService
  });
});
