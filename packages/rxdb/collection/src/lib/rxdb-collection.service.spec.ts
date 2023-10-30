/* eslint-disable @typescript-eslint/no-var-requires */
import { TestBed, inject, waitForAsync } from '@angular/core/testing';
import { NgxRxdbModule } from '@ngx-odm/rxdb';
import { NgxRxdbService } from '@ngx-odm/rxdb/core';
import {
  TEST_FEATURE_CONFIG_1,
  TEST_DB_CONFIG_2,
  getMockRxdbServiceFactory,
  TEST_SCHEMA,
} from '@ngx-odm/rxdb/testing';
import { MangoQuery } from 'rxdb';
import { Observable, take } from 'rxjs';
import {
  NgxRxdbCollection,
  NgxRxdbCollectionService,
  NgxRxdbCollectionServiceImpl,
} from './rxdb-collection.service';

describe(`NgxRxdbCollectionService`, () => {
  describe(`test methods using mock NgxRxdbService`, () => {
    let dbService: NgxRxdbService;
    let service: NgxRxdbCollection<any>;

    beforeEach(() => {
      dbService = getMockRxdbServiceFactory();
      service = new NgxRxdbCollectionServiceImpl(dbService, TEST_FEATURE_CONFIG_1);
    });

    it(`should provide Observable "initialized$" getter`, async () => {
      expect(service).toBeDefined();
      const spy = jest.spyOn(service, 'initialized$', 'get');
      const r = await service.initialized$.pipe(take(1)).toPromise();
      expect(spy).toHaveBeenCalled();
      const calls = spy.mock.calls;
      const results = spy.mock.results;
      expect(calls[0].length).toEqual(0);
      expect(results[0].value).toBeInstanceOf(Observable);
    });

    it(`should subscribe until collection init `, () => {
      const spy = jest.spyOn(dbService, 'initCollection');
      service.initialized$.subscribe(() => {
        expect(spy).toHaveBeenCalled();
        expect(service.collection).toBeDefined();
      });
    });

    it('should initialize collection', async () => {
      await service.initialized$.toPromise();
      expect(dbService.initCollection).toHaveBeenCalledWith(TEST_FEATURE_CONFIG_1);
      expect(service.collection).toBeDefined();
    });

    it('should destroy collection', () => {
      service.destroy();
      expect(service.collection.destroy).toHaveBeenCalled();
    });

    it('should get collection info', async () => {
      const meta = await service.info();
      expect(service.collection.storageInstance!.internals).toBeInstanceOf(Promise);
      expect(meta).toEqual({});
    });

    it('should import docs into collection', async () => {
      const docs = [{ id: '1' }, { id: '2' }];
      await service.import(docs);
      expect(service.collection.importJSON).toHaveBeenCalledWith({
        name: 'test',
        schemaHash: undefined,
        docs,
      });
    });

    it('should export collection', async () => {
      await service.export();
      expect(service.collection.exportJSON).toHaveBeenCalled();
    });

    it('should get docs', async () => {
      const query: MangoQuery = { sort: [{ id: 'asc' }] };
      await service.docs(query).toPromise();
      expect(service.collection.find).toHaveBeenCalledWith(query);
    });

    it('should get docs by ids', async () => {
      const ids = ['1', '2'];
      await service.docsByIds(ids).toPromise();
      expect(service.collection.findByIds).toHaveBeenCalledWith(ids);
    });

    it('should get count', async () => {
      await service.count().toPromise();
      expect(service.collection.count).toHaveBeenCalled();
    });

    it('should get one doc', async () => {
      const id = '1';
      await service.get(id).toPromise();
      expect(service.collection.findOne).toHaveBeenCalledWith(id);
    });

    it('should insert doc', async () => {
      const data = { id: '1' };
      await service.insert(data);
      expect(service.collection.insert).toHaveBeenCalledWith(data);
    });

    it('should bulk insert docs', async () => {
      const data = [{ id: '1' }, { id: '2' }];
      await service.insertBulk(data);
      expect(service.collection.bulkInsert).toHaveBeenCalledWith(data);
    });

    it('should upsert doc', async () => {
      const data = { id: '1' };
      await service.upsert(data);
      expect(service.collection.upsert).toHaveBeenCalledWith(data);
    });

    it('should set doc', async () => {
      const id = '1';
      const data = { name: 'test' };
      await service.set(id, data);
      expect(service.collection.findOne).toHaveBeenCalledWith(id);
    });

    it('should update docs', async () => {
      const query: MangoQuery = {
        selector: {
          id: {
            $eq: '1',
          },
        },
      };
      const data = { name: 'test' };
      await service.updateBulk(query, data);
      expect(service.collection.find).toHaveBeenCalledWith(query);
    });

    it('should remove doc', async () => {
      const id = '1';
      await service.remove(id);
      expect(service.collection.findOne).toHaveBeenCalledWith(id);
    });

    it('should remove docs', async () => {
      const query: MangoQuery = {
        selector: {
          id: {
            $eq: '1',
          },
        },
      };
      await service.removeBulk(query);
      expect(service.collection.find).toHaveBeenCalledWith(query);
    });

    it('should get local doc', async () => {
      const id = '1';
      await service.getLocal(id).toPromise();
      expect(service.collection.getLocal$).toHaveBeenCalledWith(id);
    });

    it('should insert local doc', async () => {
      const id = '1';
      const data = { name: 'test' };
      await service.insertLocal(id, data);
      expect(service.collection.insertLocal).toHaveBeenCalledWith(id, data);
    });

    it('should upsert local doc', async () => {
      const id = '1';
      const data = { name: 'test' };
      await service.upsertLocal(id, data);
      expect(service.collection.upsertLocal).toHaveBeenCalledWith(id, data);
    });

    it('should set local doc', async () => {
      const id = '1';
      const prop = 'name';
      const value = 'test';
      await service.setLocal(id, prop, value);
      expect(service.collection.getLocal).toHaveBeenCalledWith(id);
    });

    it('should remove local doc', async () => {
      const id = '1';
      await service.removeLocal(id);
      expect(service.collection.getLocal).toHaveBeenCalledWith(id);
    });
  });

  describe(`test dn init by feature module config`, () => {
    // let service: NgxRxdbCollection<any>;

    beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
        providers: [
          {
            provide: NgxRxdbService,
            useFactory: getMockRxdbServiceFactory,
          },
        ],
        imports: [
          NgxRxdbModule.forRoot(TEST_DB_CONFIG_2),
          NgxRxdbModule.forFeature({ name: 'todo', schema: TEST_SCHEMA }),
        ],
      });
      // await TestBed.inject(ApplicationInitStatus).donePromise;
      // service = TestBed.inject(NgxRxdbCollectionService, undefined, { skipSelf: true }) ;
    }));
    it(`should init database AND collection`, inject(
      [NgxRxdbCollectionService],
      async (service: NgxRxdbCollection<any>) => {
        await service.initialized$.pipe(take(1)).toPromise();
        expect(service.db).toBeDefined();
        // expect(service.db.name).toEqual(TEST_DB_CONFIG_2.name);
        expect(service.collection).toBeDefined();
        // const col = service.db.collections['todo'];
        // expect(col).toBeDefined();
        // expect(col.statics).toBeDefined();
        // expect(col.statics.countAllDocuments).toBeInstanceOf(Function);
      }
    ));
  });
});
