/* eslint-disable @typescript-eslint/no-var-requires */
import { ApplicationInitStatus } from '@angular/core';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { NgxRxdbCollectionService } from '@ngx-odm/rxdb/collection';
import { RXDB_CONFIG } from '@ngx-odm/rxdb/config';
import { NgxRxdbService } from '@ngx-odm/rxdb/core';
import {
  setupNavigationWarnStub,
  MockNgxRxdbService,
  TEST_DB_CONFIG_1,
  TEST_FEATURE_CONFIG_1,
} from '@ngx-odm/rxdb/testing';
import { addRxPlugin } from 'rxdb/plugins/core';
import { NgxRxdbModule } from './rxdb.module';

addRxPlugin(require('pouchdb-adapter-node-websql'));

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
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [NgxRxdbModule.forRoot(TEST_DB_CONFIG_1)],
        providers: [{ provide: NgxRxdbService, useClass: MockNgxRxdbService }],
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
    let dbInitSpy: jest.SpyInstance<Promise<void>>;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [
          NgxRxdbModule.forRoot(TEST_DB_CONFIG_1),
          NgxRxdbModule.forFeature(TEST_FEATURE_CONFIG_1),
        ],
        providers: [{ provide: NgxRxdbService, useClass: MockNgxRxdbService }],
      });
      dbService = TestBed.inject(NgxRxdbService);
      dbInitSpy = jest.spyOn(dbService, 'initDb');
    });

    it(`should init db via dbService`, waitForAsync(async () => {
      expect(dbInitSpy).toHaveBeenCalled();
      const calls = dbInitSpy.mock.calls;
      expect(calls[0].length).toEqual(1);
      expect(calls[0][0]).toEqual(TEST_DB_CONFIG_1);
      await Promise.resolve();
    }));
    /* it(`should provide collectionConfig & collection service`, waitForAsync(() => {
      expect(NgxRxdbFeatureModule).toBeDefined();
      expect(TestBed.inject(NgxRxdbCollectionService)).toBeDefined();
    })); */
  });
});
