/* eslint-disable @typescript-eslint/no-var-requires */
import { ApplicationInitStatus } from '@angular/core';
import { TestBed, inject, waitForAsync } from '@angular/core/testing';
import { NgxRxdbCollection, NgxRxdbCollectionService } from '@ngx-odm/rxdb/collection';
import { RXDB_CONFIG } from '@ngx-odm/rxdb/config';
import { NgxRxdbService } from '@ngx-odm/rxdb/core';
import {
  setupNavigationWarnStub,
  getMockRxdbService,
  TEST_DB_CONFIG_1,
  TEST_FEATURE_CONFIG_1,
} from '@ngx-odm/rxdb/testing';
import { NgxRxdbModule } from './rxdb.module';

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
      expect(() => TestBed.inject(RXDB_CONFIG)).toThrowError(
        /InjectionToken RxDatabaseCreator is not provided. Make sure you call the 'forRoot'/
      );
      expect(() => TestBed.inject(NgxRxdbService)).toThrowError(
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
      expect(TestBed.inject(NgxRxdbService)).toBeDefined();
    });

    it(`should provide db config`, () => {
      expect(TestBed.inject(RXDB_CONFIG)).toBeDefined();
    });
  });

  describe(`NgxRxdbModule :: init w/o forFeature`, () => {
    let dbService: NgxRxdbService;
    beforeEach(async () => {
      dbService = await getMockRxdbService();
      TestBed.configureTestingModule({
        imports: [NgxRxdbModule.forRoot(TEST_DB_CONFIG_1)],
        providers: [{ provide: NgxRxdbService, useValue: dbService }],
      });
    });

    it('should create', () => {
      expect(NgxRxdbModule).toBeDefined();
    });
    it(`should not provide feature config token & collection service`, () => {
      expect(dbService.initCollection).not.toHaveBeenCalled();
      expect(() => TestBed.inject(NgxRxdbCollectionService)).toThrowError(
        /No provider for/
      );
    });
  });

  describe(`NgxRxdbModule :: forFeature`, () => {
    let dbService: NgxRxdbService;

    beforeEach(async () => {
      dbService = await getMockRxdbService();
      TestBed.configureTestingModule({
        imports: [
          NgxRxdbModule.forRoot(TEST_DB_CONFIG_1),
          NgxRxdbModule.forFeature(TEST_FEATURE_CONFIG_1),
        ],
        providers: [{ provide: NgxRxdbService, useValue: dbService }],
      });
      const appInitStatus = TestBed.inject(ApplicationInitStatus);
      await appInitStatus.donePromise;
    });

    it(`should init db via dbService`, inject(
      [NgxRxdbCollectionService],
      async (colService: NgxRxdbCollection) => {
        expect(dbService.initDb).toHaveBeenCalledWith(TEST_DB_CONFIG_1);
        expect(dbService.initCollection).toHaveBeenCalledWith(TEST_FEATURE_CONFIG_1);
        expect(colService.collection).toBeDefined();
        expect(colService.collection.schema.version).toEqual(
          TEST_FEATURE_CONFIG_1.schema.version
        );
      }
    ));
  });
});
