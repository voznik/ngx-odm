import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgxRxdbCollectionService } from './rxdb-collection.service';
import { NgxRxdbCollectionConfig, NgxRxdbConfig } from './rxdb.model';
import { NgxRxdbFeatureModule, NgxRxdbModule } from './rxdb.module';
import { NgxRxdbService } from './rxdb.service';
import { RXDB_CONFIG } from './rxdb.token';

const TEST_DB_CONFIG: NgxRxdbConfig = { name: 'test', adapter: 'memory' };
const TEST_FEATURE_CONFIG: NgxRxdbCollectionConfig = { name: 'feature' };
class NgxRxdbServiceMock implements Partial<NgxRxdbService> {
  db = {} as any;
  collections = {} as any;

  initDb = () => Promise.resolve();
  initCollection = (c = {} as any) => Promise.resolve({} as any);
  getCollection = (n: string) => ({} as any);
}

describe('NgxRxdbModule', () => {
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
      expect(() => TestBed.inject(RXDB_CONFIG)).toThrowError(
        /InjectionToken NgxRxdbConfig is not provided. Make sure you call the 'forRoot'/
      );
      expect(() => TestBed.inject(NgxRxdbService)).toThrowError(
        // /No provider for/
        /InjectionToken NgxRxdbConfig is not provided. Make sure you call the 'forRoot'/
      );
    });
  });

  describe(`NgxRxdbModule :: forRoot()`, () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [NgxRxdbModule.forRoot(TEST_DB_CONFIG)],
      });
    });

    it(`should provide db service`, () => {
      expect(TestBed.inject(NgxRxdbService)).toBeDefined();
    });

    it(`should provide db config`, () => {
      expect(TestBed.inject(RXDB_CONFIG)).toBeDefined();
    });
  });

  describe(`NgxRxdbModule :: init w/o forFeature`, () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [NgxRxdbModule.forRoot(TEST_DB_CONFIG)],
        providers: [{ provide: NgxRxdbService, useClass: NgxRxdbServiceMock }],
      });
    });

    it('should create', () => {
      expect(NgxRxdbModule).toBeDefined();
    });
    it(`should not provide feature config token & collection service`, () => {
      expect(() => TestBed.inject(NgxRxdbCollectionService)).toThrowError(
        /No provider for/
      );
    });
  });

  describe(`NgxRxdbModule :: forFeature`, () => {
    let dbService: NgxRxdbService;
    let collectionService: NgxRxdbCollectionService;
    // let dbInitSpy;
    // let collectionLoadedSpy;

    beforeEach(async () => {
      TestBed.configureTestingModule({
        imports: [
          NgxRxdbModule.forRoot(TEST_DB_CONFIG),
          NgxRxdbModule.forFeature(TEST_FEATURE_CONFIG),
        ],
        providers: [{ provide: NgxRxdbService, useClass: NgxRxdbServiceMock }],
      });
      dbService = TestBed.inject(NgxRxdbService);
      collectionService = TestBed.inject(NgxRxdbCollectionService);
      // dbInitSpy = jest.spyOn(dbService, 'initDb');
      // collectionLoadedSpy = jest.spyOn(collectionService, 'collectionLoaded$');
      await TestBed.inject(ApplicationInitStatus).donePromise;
      await dbService.initDb(TEST_DB_CONFIG);
    });

    it(`should provide collectionConfig & collection service`, () => {
      expect(NgxRxdbFeatureModule).toBeDefined();
      expect(TestBed.inject(NgxRxdbCollectionService)).toBeDefined();
      // expect(dbService.initDb).toHaveBeenCalled();
    });

    /* it(
      `should wait for collection loaded`,
      waitForAsync(
        inject(
          [ApplicationInitStatus],
          (appInitStatus: ApplicationInitStatus) => {
            appInitStatus.donePromise
              .then(() => {
                expect(collectionService.db).toBeDefined();
                // expect(dbInitSpy).toHaveBeenCalled();
              })
              .catch(noop);
          }
        )
      )
    ); */
  });
});
