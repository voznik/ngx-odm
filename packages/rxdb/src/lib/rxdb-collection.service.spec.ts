/* eslint-disable @angular-eslint/directive-class-suffix */
import { ApplicationInitStatus } from '@angular/core';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { addRxPlugin } from 'rxdb/plugins/core';
import { Observable } from 'rxjs';
import { NgxRxdbCollectionService } from './rxdb-collection.service';
import { MockNgxRxdbService, TEST_DB_CONFIG_2, TEST_FEATURE_CONFIG_1 } from './rxdb.mock';
import { NgxRxdbModule } from './rxdb.module';
import { NgxRxdbService } from './rxdb.service';

addRxPlugin(require('pouchdb-adapter-node-websql'));

describe(`NgxRxdbCollectionService`, () => {
  describe(`test methods using mock NgxRxdbService`, () => {
    let dbService: NgxRxdbService;
    let service: NgxRxdbCollectionService;

    beforeEach(() => {
      dbService = new MockNgxRxdbService();
      service = new NgxRxdbCollectionService(dbService, TEST_FEATURE_CONFIG_1);
    });

    it(`should return Observable via init method`, () => {
      expect(service).toBeDefined();
      const spy = jest.spyOn(service, 'initialized$');
      service.initialized$();
      const calls = spy.mock.calls;
      const results = spy.mock.results;
      expect(calls[0].length).toEqual(0);
      expect(results[0].value).toBeInstanceOf(Observable);
    });

    it(`should subscribe until collection init `, () => {
      const spy = jest.spyOn(dbService, 'initCollection');
      service.initialized$().subscribe(() => {
        expect(spy).toHaveBeenCalled();
        expect(service.collection).toBeDefined();
      });
    });

    it(`should call sync collection of dbService `, async () => {
      const spy = jest.spyOn(dbService, 'syncCollection');
      await service.sync();
      expect(spy).toHaveBeenCalled();
    });

    it(`should return collection docs `, () => {
      service.docs({ selector: { id: '0' } }).subscribe(result => {
        expect(result).toBeDefined();
      });
    });

    it(`should return docs using 'pouch.allDocs'`, () => {
      service.allDocs({ include_docs: true }).subscribe(results => {
        expect(results).toBeDefined();
        expect(results.length).toEqual(1);
        expect(results[0]).toMatchObject({ id: '0' });
      });
    });

    it(`should return docs by array of ids`, () => {
      service.docsByIds(['0']).subscribe(results => {
        expect(results).toBeDefined();
        expect(results.length).toEqual(1);
        expect(results[0]).toMatchObject({ id: '0' });
      });
    });

    it(`should get 1 doc by id `, () => {
      service.get('0').subscribe(result => {
        expect(result).toBeDefined();
        expect(result).toMatchObject({ id: '0' });
      });
    });

    it(`should insert 1 doc by id `, () => {
      service.insert({ id: '1' }).subscribe(result => {
        expect(result).toBeDefined();
      });
    });

    it(`should upsert 1 doc by id `, () => {
      service.upsert({ id: '1' }).subscribe(result => {
        expect(result).toBeDefined();
      });
    });

    it(`should insert many docs bulk `, () => {
      service.insertBulk([{ id: '1' }, { id: '2' }]).subscribe(result => {
        expect(result).toBeDefined();
      });
    });

    it(`should update data of 1 doc by id `, () => {
      service.set('0', { x: 'y' }).subscribe(result => {
        expect(result).toBeDefined();
      });
    });

    it(`should update docs in collection by query `, () => {
      service.updateBulk({ selector: { x: 'y' } }, { y: 'x' }).subscribe(result => {
        expect(result).toBeDefined();
      });
    });

    it(`should remove 1 doc by id `, () => {
      service.remove('0').subscribe(result => {
        expect(result).toBeDefined();
      });
    });

    it(`should remove docs in collection by query `, () => {
      service.removeBulk({ selector: { x: 'y' } }).subscribe(result => {
        expect(result).toBeDefined();
      });
    });
  });

  describe(`test init by db config`, () => {
    let service: NgxRxdbCollectionService;

    beforeEach(async () => {
      TestBed.configureTestingModule({
        imports: [
          NgxRxdbModule.forRoot(TEST_DB_CONFIG_2),
          NgxRxdbModule.forFeature({ name: 'todo' }),
        ],
      });
      service = TestBed.inject(NgxRxdbCollectionService);
      await TestBed.inject(ApplicationInitStatus).donePromise;
    });
    it(
      `should init database AND collection`,
      waitForAsync(() => {
        expect(service.db).toBeDefined();
        expect(service.db.name).toEqual(TEST_DB_CONFIG_2.name);
        const col = service.db.collections['todo'];
        expect(col).toBeDefined();
        expect(col.statics).toBeDefined();
        expect(col.statics.countAllDocuments).toBeInstanceOf(Function);
      })
    );
  });
});
