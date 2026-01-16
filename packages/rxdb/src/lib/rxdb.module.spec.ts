import { ApplicationInitStatus } from '@angular/core';
import { TestBed, inject } from '@angular/core/testing';
import { RxDBCollectionService } from '@ngx-odm/rxdb/collection';
import { RxDBService } from '@ngx-odm/rxdb/core';
import {
  TEST_DB_CONFIG_1,
  TEST_FEATURE_CONFIG_1,
  getMockRxdbService,
  setupNavigationWarnStub,
} from '@ngx-odm/rxdb/testing';
import { NgxRxdbModule } from './rxdb.module';
import { RXDB, RXDB_COLLECTION, RXDB_CONFIG } from './rxdb.providers';

describe('NgxRxdbModule', () => {
  beforeAll(() => {
    setupNavigationWarnStub();
  });
  describe('NgxRxdbModule :: init w/o forRoot', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [NgxRxdbModule],
      });
    });

    it('should create', () => {
      expect(NgxRxdbModule).toBeDefined();
    });

    it(`should not provide 'RXDB_CONFIG' token & 'NgxRxdbService'`, () => {
      expect(() => TestBed.inject(RXDB_CONFIG)).toThrow(
        /InjectionToken RxDatabaseCreator is not provided. Make sure you call the 'forRoot'/
      );
      expect(() => TestBed.inject(RXDB)).toThrow(
        // /No provider for/
        /InjectionToken RxDatabaseCreator is not provided. Make sure you call the 'forRoot'/
      );
    });
  });

  describe(`NgxRxdbModule :: forRoot()`, () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [NgxRxdbModule.forRoot(TEST_DB_CONFIG_1)],
      });
    });

    it(`should provide db service`, () => {
      expect(TestBed.inject(RXDB)).toBeDefined();
    });

    it(`should provide db config`, () => {
      expect(TestBed.inject(RXDB_CONFIG)).toBeDefined();
    });
  });

  describe(`NgxRxdbModule :: init w/o forFeature`, () => {
    let dbService: RxDBService;
    beforeAll(async () => {
      dbService = await getMockRxdbService(undefined, true);
    });

    beforeEach(() => {
      jest.clearAllMocks();
      TestBed.configureTestingModule({
        imports: [NgxRxdbModule.forRoot(TEST_DB_CONFIG_1)],
        providers: [{ provide: RXDB, useValue: dbService }],
      });
    });

    afterAll(async () => {
      await dbService.destroyDb();
    });

    it('should create', () => {
      expect(NgxRxdbModule).toBeDefined();
    });
    it(`should not provide feature config token & collection service`, () => {
      expect(dbService.initCollections).not.toHaveBeenCalled();
      expect(() => TestBed.inject(RXDB_COLLECTION)).toThrow(/No provider/);
    });
  });

  describe(`NgxRxdbModule :: forFeature`, () => {
    let dbService: RxDBService;

    beforeAll(async () => {
      dbService = await getMockRxdbService(undefined, true);
    });

    beforeEach(async () => {
      jest.clearAllMocks();
      TestBed.configureTestingModule({
        imports: [
          NgxRxdbModule.forRoot(TEST_DB_CONFIG_1),
          NgxRxdbModule.forFeature(TEST_FEATURE_CONFIG_1),
        ],
        providers: [{ provide: RXDB, useValue: dbService }],
      });
      const appInitStatus = TestBed.inject(ApplicationInitStatus);
      await appInitStatus.donePromise;
    });

    afterAll(async () => {
      await dbService.destroyDb();
    });

    it(`should init db via dbService`, inject(
      [RXDB_COLLECTION],
      async (colService: RxDBCollectionService) => {
        expect(dbService.initDb).toHaveBeenCalledWith(TEST_DB_CONFIG_1);
        expect(dbService.initCollections).toHaveBeenCalledWith({
          [TEST_FEATURE_CONFIG_1.name]: TEST_FEATURE_CONFIG_1,
        });
        const meta = await colService.info();
        expect(colService.collection).toBeDefined();
        expect(meta.rev).toBe(1);
        expect(colService.collection.schema.version).toEqual(
          TEST_FEATURE_CONFIG_1.schema.version
        );
      }
    ));
  });
});
