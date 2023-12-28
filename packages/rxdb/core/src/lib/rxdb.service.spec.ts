/* eslint-disable @typescript-eslint/no-var-requires */
import { TestBed } from '@angular/core/testing';
import { NgxRxdbModule } from '@ngx-odm/rxdb';
import { TEST_DB_CONFIG_1, TEST_SCHEMA } from '@ngx-odm/rxdb/testing';
import { NgxRxdbService } from './rxdb.service';

describe('NgxRxdbService', () => {
  let service: NgxRxdbService;
  beforeEach(async () => {
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
      const name = 'collection1';
      const colConfig = {
        name,
        schema: TEST_SCHEMA,
      };
      const collection = (await service.initCollections({ [name]: colConfig }))[name];
      expect(collection).toBeDefined();
      expect(collection.name).toEqual(name);
      expect(spyAddCollections).toHaveBeenCalled();
    });

    it('should recreate a collection if the recreate option is set', async () => {
      await service.initDb(TEST_DB_CONFIG_1);
      const name = 'collection1';
      const colConfig = {
        name,
        schema: TEST_SCHEMA,
        options: { recreate: true },
      };
      const collection = (await service.initCollections({ [name]: colConfig }))[name];
      expect(collection).toBeDefined();
      expect(collection.name).toEqual(name);
    });

    it('should throw an error if the collection cannot be created', async () => {
      await service.initDb(TEST_DB_CONFIG_1);
      const invalidColConfig = {
        name: 'collection1',
        schema: null,
      };
      let exception;
      try {
        await service.initCollections(invalidColConfig as any);
      } catch (e) {
        exception = e;
      }
      expect(exception).toBeDefined();
    });
  });
});
