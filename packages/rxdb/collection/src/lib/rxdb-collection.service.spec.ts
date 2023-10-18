/* eslint-disable @typescript-eslint/no-var-requires */
import { ApplicationInitStatus } from '@angular/core';
import { TestBed, inject, waitForAsync } from '@angular/core/testing';
import { NgxRxdbModule } from '@ngx-odm/rxdb';
import { NgxRxdbService } from '@ngx-odm/rxdb/core';
import {
  TEST_FEATURE_CONFIG_1,
  TEST_DB_CONFIG_2,
  MockNgxRxdbService,
} from '@ngx-odm/rxdb/testing';
import { addRxPlugin } from 'rxdb/plugins/core';
import { Observable, take } from 'rxjs';
import {
  NgxRxdbCollection,
  NgxRxdbCollectionService,
  NgxRxdbCollectionServiceImpl,
} from './rxdb-collection.service';

addRxPlugin(require('pouchdb-adapter-memory'));

describe(`NgxRxdbCollectionService`, () => {
  describe(`test methods using mock NgxRxdbService`, () => {
    let dbService: NgxRxdbService;
    let service: NgxRxdbCollection<any>;

    beforeEach(() => {
      dbService = new MockNgxRxdbService();
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

    it(`should perform collection sync`, async () => {
      const spy = jest.spyOn(dbService, 'syncCollection');
      // await service.initialized$.pipe(take(1)).toPromise();
      service.sync();
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
      service.insert({ id: '1' })!.subscribe!(result => {
        expect(result).toBeDefined();
      });
    });

    it(`should upsert 1 doc by id `, () => {
      service.upsert({ id: '1' }).subscribe!(result => {
        expect(result).toBeDefined();
      });
    });

    it(`should insert many docs bulk `, () => {
      service.insertBulk([{ id: '1' }, { id: '2' }]).subscribe!(result => {
        expect(result).toBeDefined();
      });
    });

    it(`should update data of 1 doc by id `, () => {
      service.set('0', { x: 'y' }).subscribe!(result => {
        expect(result).toBeDefined();
      });
    });

    it(`should update docs in collection by query `, () => {
      service.updateBulk({ selector: { x: 'y' } }, { y: 'x' }).subscribe!(result => {
        expect(result).toBeDefined();
      });
    });

    it(`should remove 1 doc by id `, () => {
      service.remove('0').subscribe!(result => {
        expect(result).toBeDefined();
      });
    });

    it(`should remove docs in collection by query `, () => {
      service.removeBulk({ selector: { x: 'y' } }).subscribe!(result => {
        expect(result).toBeDefined();
      });
    });
  });

  describe(`test dn init by feature module config`, () => {
    // let service: NgxRxdbCollection<any>;

    beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
        providers: [
          {
            provide: NgxRxdbService,
            useClass: MockNgxRxdbService,
          },
        ],
        imports: [
          NgxRxdbModule.forRoot(TEST_DB_CONFIG_2),
          NgxRxdbModule.forFeature({ name: 'todo' }),
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
