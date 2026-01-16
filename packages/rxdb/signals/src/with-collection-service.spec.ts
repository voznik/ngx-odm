import { TestBed } from '@angular/core/testing';
import { getState, signalStore } from '@ngrx/signals';
import { withEntities } from '@ngrx/signals/entities';
import { EntitySignals } from '@ngrx/signals/entities/src/models';
import { RXDB_COLLECTION, RXDB, provideRxCollection } from '@ngx-odm/rxdb';
import { RxDBCollectionService } from '@ngx-odm/rxdb/collection';
import { RxDBService } from '@ngx-odm/rxdb/core';
import {
  MOCK_DATA,
  TEST_FEATURE_CONFIG_1,
  TestDocType,
  getMockRxdbService,
} from '@ngx-odm/rxdb/testing';
import { MangoQuery, RxCollection } from 'rxdb';
import { firstValueFrom } from 'rxjs';
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
    let dbService: RxDBService;

    beforeAll(async () => {
      dbService = await getMockRxdbService();
      TestBed.configureTestingModule({
        providers: [
          //
          { provide: RXDB, useValue: dbService },
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
    let dbService: RxDBService;
    let rxCollection: RxCollection<TestDocType>;
    let colService: RxDBCollectionService<TestDocType>;
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
          { provide: RXDB, useValue: dbService },
          provideRxCollection(TEST_FEATURE_CONFIG_1),
          TestStore,
        ],
        teardown: {
          destroyAfterEach: false,
        },
      });
      store = TestBed.inject(TestStore) as any;
      colService = TestBed.inject(RXDB_COLLECTION) as any;
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
      await store[insertKey]({
        ...MOCK_DATA[0],
        id: '4',
        title: 'Title 4',
        createdAt: 1546300800200,
      });
      const entities = store.entities();
      expect(entities).toEqual(
        MOCK_DATA.concat({
          ...MOCK_DATA[0],
          id: '4',
          title: 'Title 4',
          createdAt: 1546300800200,
        })
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
