/* eslint-disable @typescript-eslint/no-unused-vars */
import { TestBed } from '@angular/core/testing';
import { getState, signalStore } from '@ngrx/signals';
import { EntityState, withEntities } from '@ngrx/signals/entities';
// import { STATE_SIGNAL } from '@ngrx/signals/src/state-signal';
import { EntitySignals } from '@ngrx/signals/entities/src/models';
import { provideRxCollection } from '@ngx-odm/rxdb';
import { NgxRxdbCollection, NgxRxdbCollectionService } from '@ngx-odm/rxdb/collection';
import { RxCollectionCreatorExtended } from '@ngx-odm/rxdb/config';
import { NgxRxdbService } from '@ngx-odm/rxdb/core';
import {
  MOCK_DATA,
  MOCK_DATA_MAP,
  TEST_FEATURE_CONFIG_1,
  TestDocType,
  getMockRxdbService,
} from '@ngx-odm/rxdb/testing';
import { NgxRxdbUtils } from '@ngx-odm/rxdb/utils';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { MangoQuery, RxCollection } from 'rxdb';
import { Subscription, firstValueFrom, take } from 'rxjs';
import {
  CollectionServiceMethods,
  CollectionServiceSignals,
  CollectionServiceState,
  getCollectionServiceKeys,
  withCollectionService,
} from './with-collection-service';

describe('withCollectionService', () => {
  describe('incorrect usage', () => {
    const TestStore = signalStore(
      withCollectionService({
        filter: 'any',
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
    let store: CollectionServiceState<TestDocType, string> &
      EntitySignals<TestDocType> &
      CollectionServiceSignals<TestDocType> &
      CollectionServiceMethods<TestDocType, string>;
    let dbService: NgxRxdbService;
    let rxCollection: RxCollection<TestDocType>;
    let colService: NgxRxdbCollection<TestDocType>;
    let spyFind: jest.SpyInstance;

    /** mock data & wait for promise from collection */
    async function ensureCollectionFind() {
      await rxCollection.bulkInsert(MOCK_DATA).catch();
      // expect(spyFind).toHaveBeenCalledWith(undefined);
      await firstValueFrom(spyFind.mock.results[0].value.$);
    }

    const entitiesMapKey = 'entityMap';
    const {
      entitiesKey,
      filterKey,
      selectedEntitiesKey,
      selectedIdsKey,
      restoreFilterKey,
      updateFilterKey,
      updateSelectedKey,

      currentKey,
      insertKey,
      updateKey,
      updateAllByKey,
      removeKey,
      removeAllByKey,
      setCurrentKey,
    } = getCollectionServiceKeys({});

    beforeEach(async () => {
      const randomName = true;
      dbService = await getMockRxdbService(TEST_FEATURE_CONFIG_1, randomName);
      const TestStore = signalStore(
        withEntities<TestDocType>(),
        withCollectionService({
          filter: 'any',
          query: undefined,
        })
      );
      TestBed.configureTestingModule({
        providers: [
          //
          { provide: NgxRxdbService, useValue: dbService },
          provideRxCollection(TEST_FEATURE_CONFIG_1),
          TestStore,
        ],
        teardown: {
          destroyAfterEach: false,
        },
      });
      store = TestBed.inject(TestStore) as any;
      colService = TestBed.inject(NgxRxdbCollectionService) as any;
      rxCollection = dbService.collections['test'];
      spyFind = jest.spyOn(rxCollection, 'find');
    });

    afterEach(async () => {
      // await rxCollection.bulkUpsert(NgxRxdbUtils.clone(MOCK_DATA));
    });
    it('should return a SignalStoreFeature', () => {
      expect(store).toBeDefined();
      expect(store[entitiesKey]).toBeDefined();
      expect(store.filter).toBeDefined();
      expect(store.count).toBeInstanceOf(Function);
    });
    it('should init subscription to docs when store inited', async () => {
      await ensureCollectionFind();
      const entities = store.entities();
      expect(entities).toEqual(MOCK_DATA);
    });
    // FIXME
    xit('should init subscription to docs when store inited with custom query', async () => {
      const query: MangoQuery<TestDocType> = {
        selector: {
          title: { $regex: MOCK_DATA[0].title },
        },
      };
      const spy = jest.spyOn(rxCollection, 'find');
      // const sub = store.findAllDocs(query);
      expect(spy).toHaveBeenCalledWith(query);
      // expect(sub).toBeInstanceOf(Subscription);
      await firstValueFrom(spy.mock.results[1].value.$); // wait for promise from collection
      const result = getState(store as any)[entitiesMapKey];
      expect(result).toEqual({ [MOCK_DATA[0].id]: MOCK_DATA[0] });
    });
    it(`should handle method "${insertKey}"`, async () => {
      await ensureCollectionFind();
      await store[insertKey]({ ...MOCK_DATA[0], id: '4', title: 'Title 4' });
      const entities = store.entities();
      expect(entities).toEqual(
        MOCK_DATA.concat({ ...MOCK_DATA[0], id: '4', title: 'Title 4' })
      );
    });
    it(`should handle method "${updateKey}"`, async () => {
      await ensureCollectionFind();
      await store[updateKey]({ ...MOCK_DATA[0], title: 'CHANGED' });
      const entities = store.entities();
      expect(entities[0]).toEqual({ ...MOCK_DATA[0], title: 'CHANGED' });
    });
    it(`should handle method "${updateAllByKey}"`, async () => {
      await ensureCollectionFind();
      await store[updateAllByKey](
        { selector: { completed: { $eq: false } } },
        { completed: true }
      );
      const entities = store.entities();
      expect(entities).toEqual(MOCK_DATA.map(d => ({ ...d, completed: true })));
    });
    it(`should handle method "${removeKey}"`, async () => {
      await ensureCollectionFind();
      await store[removeKey](MOCK_DATA[0]);
      const entities = store.entities();
      const expected = MOCK_DATA.slice(1);
      expect(entities).toEqual(expected);
    });
    it(`should handle method "${removeAllByKey}"`, async () => {
      await ensureCollectionFind();
      await store[removeAllByKey]({
        selector: { createdAt: { $gt: MOCK_DATA[0].createdAt } },
      });
      const entities = store.entities();
      const expected = MOCK_DATA.slice(0, 1);
      expect(entities).toEqual(expected);
    });
  });
});
