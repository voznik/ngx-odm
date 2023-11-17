/* eslint-disable @typescript-eslint/no-var-requires */
import { NgxRxdbService } from '@ngx-odm/rxdb/core';
import { TEST_FEATURE_CONFIG_1, getMockRxdbService } from '@ngx-odm/rxdb/testing';
import { MangoQuery, RxQuery } from 'rxdb';
import { createRxLocalDocument } from 'rxdb/plugins/local-documents';
import { Observable, firstValueFrom } from 'rxjs';
import { NgxRxdbCollection } from './rxdb-collection.service';

describe(`NgxRxdbCollectionService`, () => {
  describe(`test methods using mock NgxRxdbService`, () => {
    let dbService: NgxRxdbService;
    let service: NgxRxdbCollection;

    beforeAll(async () => {
      dbService = await getMockRxdbService();
      service = new NgxRxdbCollection(dbService, TEST_FEATURE_CONFIG_1);
    });

    afterEach(() => {
      // jest.restoreAllMocks();
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
      const spy = jest.spyOn(dbService, 'initCollection');
      service.initialized$.subscribe(() => {
        expect(spy).toHaveBeenCalled();
        expect(service.collection).toBeDefined();
      });
    });

    it('should initialize collection', async () => {
      await firstValueFrom(service.initialized$);
      expect(dbService.initCollection).toHaveBeenCalledWith(TEST_FEATURE_CONFIG_1);
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

    it('should get collection info', async () => {
      const storageInfo = await service.info();
      expect(storageInfo).toMatchObject({ totalCount: expect.any(Number) });
    });

    it('should import docs into collection', async () => {
      const docs = [{ id: '1' }, { id: '2' }];
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
      const data = { id: '0' };
      await service.insert(data);
      expect(service.collection.insert).toHaveBeenCalledWith(data);
    });

    it('should bulk insert docs', async () => {
      const data = [{ id: '11' }, { id: '22' }];
      await service.insertBulk(data);
      expect(service.collection.bulkInsert).toHaveBeenCalledWith(data);
    });

    it('should upsert doc', async () => {
      const data = { id: '11' };
      await service.upsert(data);
      expect(service.collection.upsert).toHaveBeenCalledWith(data);
    });

    it('should set doc', async () => {
      const id = '0';
      // const rxDoc: RxDocument = createNewRxDocument(service.collection, { id: '0', title: 'test0', _rev: '0-x', } as any);
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
      const data = { name: 'test' };
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

    it('should get local doc', async () => {
      const id = '1';
      await firstValueFrom(service.getLocal(id));
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
      const mockLocalDoc = createRxLocalDocument<any>({ id: '0', data: {} } as any, {});
      jest.spyOn(mockLocalDoc, 'update').mockResolvedValue(null as any);
      jest.spyOn(service.collection, 'getLocal').mockResolvedValueOnce(null);
      const result = await service.setLocal(id, prop, value);
      expect(service.collection.getLocal).toHaveBeenCalledWith(id);
      expect(mockLocalDoc.update).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should not update local doc if not found', async () => {
      const id = '1';
      const prop = 'name';
      const value = 'updated';
      const mockLocalDoc = createRxLocalDocument<any>(
        { id: '1', data: { [prop]: 'empty' } } as any,
        {}
      );
      jest
        .spyOn(mockLocalDoc, 'update')
        .mockResolvedValue(
          createRxLocalDocument<any>({ id: '1', data: { [prop]: value } } as any, {}) as any
        );
      jest.spyOn(service.collection, 'getLocal').mockResolvedValueOnce(mockLocalDoc);
      const result = await service.setLocal(id, prop, value);
      expect(service.collection.getLocal).toHaveBeenCalledWith(id);
      expect(mockLocalDoc.update).toHaveBeenCalled();
      const { data } = result!.toJSON();
      expect(data).toEqual({ [prop]: value });
    });

    it('should remove local doc', async () => {
      const id = '1';
      await service.removeLocal(id);
      expect(service.collection.getLocal).toHaveBeenCalledWith(id);
    });
  });
});
