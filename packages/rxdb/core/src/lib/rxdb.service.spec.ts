/* eslint-disable @typescript-eslint/no-var-requires */
import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgxRxdbModule } from '@ngx-odm/rxdb';
import { TEST_DB_CONFIG_1, TEST_DB_CONFIG_2, TEST_SCHEMA } from '@ngx-odm/rxdb/testing';
import { NgxRxdbService } from './rxdb.service';

describe('NgxRxdbService', () => {
  let service: NgxRxdbService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NgxRxdbModule.forRoot(TEST_DB_CONFIG_1)],
    });
    service = TestBed.inject(NgxRxdbService);
  });

  afterEach(() => {
    (service as any) = null;
  });

  describe(`:: init`, () => {
    it('should initialize the database', async () => {
      await service.initDb(TEST_DB_CONFIG_1);
      expect(service.db).toBeDefined();
      expect(service.db.name).toEqual(TEST_DB_CONFIG_1.name);
    });

    it('should destroy the database', async () => {
      const spyRemove = jest.spyOn(service.db, 'remove');
      const spyDestroy = jest.spyOn(service.db, 'destroy');
      await service.destroyDb();
      expect(spyRemove).toHaveBeenCalled();
      expect(spyDestroy).toHaveBeenCalled();
      expect(service.db).toBeNull();
    });

    it('should throw an error if the database cannot be created', async () => {
      const invalidConfig = { name: '', storage: null };
      let exception;
      try {
        await service.initDb(invalidConfig as any);
      } catch (e) {
        exception = e;
      }
      expect(exception).toBeDefined();
    });

    it('should initialize multiple collections from config', async () => {
      const dbConfig = {
        ...TEST_DB_CONFIG_1,
        options: {
          schemas: {
            collection1: {
              name: 'collection1',
              schema: TEST_SCHEMA,
            },
            collection2: {
              name: 'collection2',
              schema: TEST_SCHEMA,
            },
          },
        },
      };
      const spy = jest.spyOn(service, 'initCollections');
      await service.initDb(dbConfig);
      expect(spy).toHaveBeenCalled();
      expect(service.collections['collection1']).toBeDefined();
      expect(service.collections['collection2']).toBeDefined();
    });

    it('should throw an error if the collections cannot be created', async () => {
      await service.initDb(TEST_DB_CONFIG_1);
      const invalidColConfigs = {
        collection1: {
          schema: null,
        },
        collection2: {
          schema: null,
        },
        collection3: {
          schema: null,
        },
      };
      let exception;
      try {
        await service.initDb(invalidColConfigs as any);
      } catch (e) {
        exception = e;
      }
      expect(exception).toBeDefined();
    });

    it('should initialize single collection via method', async () => {
      await service.initDb(TEST_DB_CONFIG_1);
      const spyAddCollections = jest.spyOn(service.db, 'addCollections');
      const colConfig = {
        name: 'collection1',
        schema: TEST_SCHEMA,
      };
      const collection = await service.initCollection(colConfig);
      expect(collection).toBeDefined();
      expect(collection.name).toEqual(colConfig.name);
      expect(spyAddCollections).toHaveBeenCalled();
    });

    it('should skip if single collection already init', async () => {
      const dbConfig = {
        ...TEST_DB_CONFIG_1,
        options: {
          schemas: {
            collection1: {
              name: 'collection1',
              schema: TEST_SCHEMA,
            },
          },
        },
      };
      await service.initDb(dbConfig);
      const spyAddCollections = jest.spyOn(service.db, 'addCollections');
      const colConfig = {
        name: 'collection1',
        schema: TEST_SCHEMA,
      };
      const collection = await service.initCollection(colConfig);
      expect(collection).toBeDefined();
      expect(collection.name).toEqual(colConfig.name);
      expect(spyAddCollections).not.toHaveBeenCalled();
    });

    it('should recreate a collection if the recreate option is set', async () => {
      await service.initDb(TEST_DB_CONFIG_1);
      const colConfig = {
        name: 'collection1',
        schema: TEST_SCHEMA,
        options: { recreate: true },
      };
      const collection = await service.initCollection(colConfig);
      expect(collection).toBeDefined();
      expect(collection.name).toEqual(colConfig.name);
    });

    it('should throw an error if the collection cannot be created', async () => {
      await service.initDb(TEST_DB_CONFIG_1);
      const invalidColConfig = {
        name: 'collection1',
        schema: null,
      };
      let exception;
      try {
        await service.initCollection(invalidColConfig as any);
      } catch (e) {
        exception = e;
      }
      expect(exception).toBeDefined();
    });
  });

  /* describe(`:: init db AND col`, () => {
    beforeEach(async () => {
      TestBed.configureTestingModule({
        imports: [NgxRxdbModule.forRoot(TEST_DB_CONFIG_2)],
      });
      service = TestBed.inject(NgxRxdbService);
      await TestBed.inject(ApplicationInitStatus).donePromise;
    });
    it(`should init database AND collection`, () => {
      expect(service.db).toBeDefined();
      expect(service.db.name).toBeDefined();
      // expect(service.db.name).toEqual(TEST_DB_CONFIG_2.name);
      expect(service.db.collections['todo']).toBeDefined();
      // expect(service.db.collections['todo']?.statics?.countAllDocuments).toBeInstanceOf(Function);
    });
  }); */
});
