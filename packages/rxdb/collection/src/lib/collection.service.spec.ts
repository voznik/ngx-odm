/* eslint-disable @typescript-eslint/no-var-requires */
import { TestBed } from '@angular/core/testing';
import { RxDBService } from '@ngx-odm/rxdb/core';
import {
  TEST_FEATURE_CONFIG_1,
  TestDocType,
  getMockRxdbService,
} from '@ngx-odm/rxdb/testing';
import { MangoQuery, RxQuery } from 'rxdb';
import { createRxLocalDocument } from 'rxdb/plugins/local-documents';
import { RxReplicationState } from 'rxdb/plugins/replication';
import { EMPTY, Observable, Subject, firstValueFrom, of } from 'rxjs';
import {
  RxDBCollectionService,
  NgxRxdbCollectionService,
  collectionServiceFactory,
} from './collection.service';

const getMockReplicationState = (obj: Partial<RxReplicationState<any, any>>) => {
  obj.reSync = jest.fn();
  obj.cancel = jest.fn();
  obj.startPromise = Promise.resolve();
  Object.setPrototypeOf(obj, RxReplicationState.prototype);
  return obj as RxReplicationState<any, any>;
};

describe(`NgxRxdbCollectionService`, () => {
  describe(`test methods using mock NgxRxdbService`, () => {
    let dbService: RxDBService;
    let service: RxDBCollectionService<TestDocType>;

    beforeEach(async () => {
      dbService = await getMockRxdbService();
      TestBed.configureTestingModule({
        providers: [
          { provide: RxDBService, useValue: dbService },
          {
            provide: NgxRxdbCollectionService,
            useFactory: collectionServiceFactory(TEST_FEATURE_CONFIG_1),
          },
        ],
      });
      service = TestBed.inject(NgxRxdbCollectionService) as any;
    });

    afterEach(() => {
      jest.restoreAllMocks();
      // await expect(result).rejects.toThrowError();
    });

    it(`should provide Observable "initialized$" getter`, async () => {
      expect(service).toBeDefined();
      const spy = jest.spyOn(service, 'initialized$', 'get');
      await firstValueFrom(service.initialized$);
      expect(spy).toHaveBeenCalled();
      const calls = spy.mock.calls;
      const results = spy.mock.results;
      expect(calls[0].length).toEqual(0);
      expect(results[0].value).toBeInstanceOf(Observable);
    });

    it(`should subscribe until collection init `, () => {
      const spy = jest.spyOn(dbService, 'initCollections');
      service.initialized$.subscribe(() => {
        expect(spy).toHaveBeenCalled();
        expect(service.collection).toBeDefined();
      });
    });

    it('should initialize collection', async () => {
      await firstValueFrom(service.initialized$);
      expect(dbService.initCollections).toHaveBeenCalledWith({
        [TEST_FEATURE_CONFIG_1.name]: TEST_FEATURE_CONFIG_1,
      });
      expect(service.collection).toBeDefined();
    });

    it('should destroy collection', async () => {
      jest.spyOn(service.collection, 'destroy').mockResolvedValue(null as any);
      await service.destroy();
      expect(service.collection.destroy).toHaveBeenCalled();
    });

    it('should clear collection', async () => {
      jest.spyOn(service.collection, 'remove').mockResolvedValue(null as any);
      await service.clear();
      expect(service.collection.remove).toHaveBeenCalled();
    });

    it('should always ensure collection is created asynchronously before calling any method (e.g. `info`)', async () => {
      const spy = jest
        .spyOn(service, 'initialized$', 'get')
        .mockImplementation(() => of(true));
      await service.info();
      expect(spy).toHaveBeenCalled();
    });

    it('should throw an error if collection is not initialized and initialized$ rejects', async () => {
      service['_collection'] = null as any;
      service['_init$'] = new Subject() as any;
      service['_init$'].complete();
      await expect(service.info()).rejects.toThrow(
        `Collection "${service.config.name}" was not initialized. Please check RxDB errors.`
      );
    });

    it('should handle valid replicationState', async () => {
      service.config.options = {
        ...service.config.options,
        replicationStateFactory: jest.fn(),
      };
      jest.spyOn(service, 'replicationState', 'get').mockReturnValue(
        getMockReplicationState({
          isStopped: jest.fn().mockReturnValue(false),
          error$: EMPTY,
          autoStart: true,
        })
      );
      await service.sync();
      expect(service.replicationState).toBeDefined();
      expect(service.replicationState!.isStopped()).toBeFalsy();
      expect(service.replicationState!.reSync).toHaveBeenCalled();
    });

    it('should create replicationState from factory and sync', async () => {
      service.config.options = {
        ...service.config.options,
        replicationStateFactory: jest.fn().mockReturnValueOnce(getMockReplicationState({})),
      };
      await service.sync();
      expect(service.config.options!.replicationStateFactory).toHaveBeenCalled();
      expect(service.replicationState).toBeDefined();
      expect(service.replicationState!.reSync).toHaveBeenCalled();
    });

    it('should ignore wrong replicationStateFactory', async () => {
      service.config.options = {
        ...service.config.options,
        replicationStateFactory: {} as any,
      };
      await service.sync();
      expect(service.replicationState).toBeNull();
    });

    it('should handle error in replicationStateFactory', async () => {
      service.config.options = {
        ...service.config.options,
        replicationStateFactory: jest.fn().mockImplementation(() => {
          throw new Error('Test error');
        }),
      };
      await service.sync();
      expect(service.config.options!.replicationStateFactory).toHaveBeenCalled();
    });

    it('should get collection info', async () => {
      const storageInfo = await service.info();
      expect(storageInfo).toMatchObject({
        collectionName: TEST_FEATURE_CONFIG_1.name,
        databaseName: TEST_FEATURE_CONFIG_1.name,
        id: expect.stringMatching(`collection|${TEST_FEATURE_CONFIG_1.name}-0`),
        isFirstTimeInstantiated: expect.any(Boolean),
        last_modified: expect.any(Number),
        rev: 1,
        storageName: expect.any(String),
      });
    });

    it('should import docs into collection', async () => {
      const docs = [{ id: '1' }, { id: '2' }] as TestDocType[];
      await service.import(docs);
      expect(service.collection.importJSON).toHaveBeenCalledWith({
        name: 'test',
        schemaHash: expect.any(String),
        docs,
      });
    });

    it('should export collection', async () => {
      await service.export();
      expect(service.collection.exportJSON).toHaveBeenCalled();
    });

    it('should get docs', async () => {
      const query: MangoQuery = { sort: [{ id: 'asc' }] };
      await firstValueFrom(service.docs(query));
      expect(service.collection.find).toHaveBeenCalledWith(query);
    });

    it('should get docs by ids', async () => {
      const ids = ['1', '2'];
      await firstValueFrom(service.docsByIds(ids));
      expect(service.collection.findByIds).toHaveBeenCalledWith(ids);
    });

    it('should get count', async () => {
      await firstValueFrom(service.count());
      expect(service.collection.count).toHaveBeenCalled();
    });

    it('should get one doc', async () => {
      const id = '1';
      await firstValueFrom(service.get(id));
      expect(service.collection.findOne).toHaveBeenCalledWith(id);
    });

    it('should insert doc', async () => {
      const data = { id: '0' } as TestDocType;
      await service.insert(data);
      expect(service.collection.insert).toHaveBeenCalledWith(data);
    });

    it('should bulk insert docs', async () => {
      const data = [{ id: '11' }, { id: '22' }] as TestDocType[];
      await service.insertBulk(data);
      expect(service.collection.bulkInsert).toHaveBeenCalledWith(data);
    });

    it('should upsert doc', async () => {
      const data = { id: '11' } as TestDocType;
      await service.upsert(data);
      expect(service.collection.upsert).toHaveBeenCalledWith(data);
    });

    it('should bulk upsert doc', async () => {
      const data = [{ id: '11' }] as TestDocType[];
      await service.upsertBulk(data);
      expect(service.collection.bulkUpsert).toHaveBeenCalledWith(data);
    });

    it('should set doc', async () => {
      const id = '0';
      const rxQ = {
        update: jest.fn().mockResolvedValue({}),
      } as unknown as RxQuery;
      // rxQ._result = new RxQuerySingleResult(service.collection, [rxDoc._data], 1);
      jest.spyOn(rxQ, 'update');
      jest.spyOn(service.collection, 'findOne').mockReturnValueOnce(rxQ);
      await service.set(id, { title: 'test1' });
      expect(service.collection.findOne).toHaveBeenCalledWith(id);
      expect(rxQ.update).toHaveBeenCalledWith({ $set: { title: 'test1' } });
    });

    it('should update docs', async () => {
      const query: MangoQuery = {
        selector: {
          id: {
            $eq: '1',
          },
        },
      };
      const data = { title: 'test' } as TestDocType;
      await service.updateBulk(query, data);
      expect(service.collection.find).toHaveBeenCalledWith(query);
    });

    it('should remove doc', async () => {
      const id = '0';
      const rxQ = {
        remove: jest.fn().mockResolvedValue({}),
      } as unknown as RxQuery;
      jest.spyOn(rxQ, 'remove');
      jest.spyOn(service.collection, 'findOne').mockReturnValueOnce(rxQ);
      await service.remove(id);
      expect(service.collection.findOne).toHaveBeenCalledWith(id);
    });

    it('should remove docs by query', async () => {
      jest.spyOn(service.collection, 'find').mockReturnValueOnce({
        remove: jest.fn().mockResolvedValue(new Map()),
      } as any);
      const query: MangoQuery = {
        selector: {
          id: {
            $eq: '0',
          },
        },
      };
      await service.removeBulk(query);
      expect(service.collection.find).toHaveBeenCalledWith(query);
    });

    it('should remove docs by ids', async () => {
      await service.removeBulk(['11', '22']);
      expect(service.collection.bulkRemove).toHaveBeenCalledWith(['11', '22']);
    });

    it('should get local doc async', async () => {
      const id = '1';
      await service.getLocal(id);
      expect(service.collection.getLocal).toHaveBeenCalledWith(id);
    });

    it('should get local doc as observable', async () => {
      const id = '1';
      await firstValueFrom(service.getLocal$(id));
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

    it('should update local doc by path', async () => {
      const id = '1';
      const prop = 'foo';
      const value = 'bar';
      const mockLocalDoc = createRxLocalDocument<any>(
        { id: '1', data: { [prop]: 'empty' } } as any,
        {}
      );
      jest.spyOn(service.collection, 'getLocal').mockResolvedValueOnce(mockLocalDoc);
      await service.setLocal(id, prop, value);
      expect(service.collection.upsertLocal).toHaveBeenCalledWith(id, { [prop]: value });
      const result = await service.getLocal(id);
      expect(result).toEqual({ [prop]: value });
    });

    it('should insert local doc if not found', async () => {
      const id = '1';
      const prop = 'name';
      const value = 'updated';
      jest.spyOn(service.collection, 'getLocal').mockResolvedValueOnce(null);
      await service.setLocal(id, prop, value);
      expect(service.collection.upsertLocal).toHaveBeenCalled();
    });

    it('should remove local doc', async () => {
      const id = '1';
      const mockLocalDoc = createRxLocalDocument<any>({ id: '1', data: {} } as any, {});
      jest.spyOn(mockLocalDoc, 'remove').mockResolvedValueOnce(mockLocalDoc as any);
      jest.spyOn(service.collection, 'getLocal').mockResolvedValueOnce(mockLocalDoc);
      await service.removeLocal(id);
      expect(mockLocalDoc.remove).toHaveBeenCalled();
    });

    it('should return all attachments of a doc as array of blob', async () => {
      const id = '10';
      const data = new Blob(['test'], { type: 'text/plain' });
      const spy = jest.spyOn(service.collection, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          allAttachments: jest.fn().mockReturnValue([
            {
              getData: () => Promise.resolve(data),
            },
          ]),
        }),
      } as any);
      const result = await service.getAttachments(id);
      expect(spy).toHaveBeenCalled();
      expect(result).toEqual([data]);
    });

    it('should return one attachment by its id of a doc as blob', async () => {
      const id = '11';
      const data = new Blob(['test'], { type: 'text/plain' });
      const spy = jest.spyOn(service.collection, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          getAttachment: jest.fn().mockReturnValue({
            getData: () => Promise.resolve(data),
          }),
        }),
      } as any);
      const result = await service.getAttachmentById(id, 'test');
      expect(spy).toHaveBeenCalled();
      expect(result).toEqual(data);
    });

    it(' should use plugin to set QueryParams ', () => {
      const query = { selector: { id: { $eq: '0' } } };
      const spy = jest.spyOn(service.collection.queryParams!, 'set');
      service.setQueryParams(query);
      expect(spy).toHaveBeenCalledWith(query);
    });

    it(' should use plugin to patch QueryParams ', () => {
      const query = { limit: 1 };
      const spy = jest.spyOn(service.collection.queryParams!, 'patch');
      service.patchQueryParams(query);
      expect(spy).toHaveBeenCalledWith(query);
    });
  });
});
