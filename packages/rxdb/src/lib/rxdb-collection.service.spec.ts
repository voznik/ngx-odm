/* eslint-disable @angular-eslint/directive-class-suffix */
/* eslint-disable no-console */
import {
  ApplicationInitStatus,
  Directive,
  Injectable,
  InjectFlags,
  NgModule,
  NgModuleFactoryLoader,
  NgZone,
} from '@angular/core';
import {
  fakeAsync,
  flush,
  flushMicrotasks,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { RxCollection } from 'rxdb';
import { Observable, of } from 'rxjs';
import * as _async from 'rxjs/scheduler/async';
import { NgxRxdbCollectionService } from './rxdb-collection.service';
import {
  MockNgxRxdbService,
  TEST_DB_CONFIG_1,
  TEST_DB_CONFIG_2,
  TEST_FEATURE_CONFIG_1,
} from './rxdb.mock';
import { NgxRxdbFeatureModule, NgxRxdbModule } from './rxdb.module';
import { NgxRxdbService } from './rxdb.service';

// jest.mock('./rxdb.service');
/* , () => ({
  NgxRxdbService: function () {
    return {
      calc: jest.fn((a, b) => a * b),
    };
  },
})); */

describe(`NgxRxdbCollectionService :: init`, () => {
  let dbService: NgxRxdbService;
  let service: NgxRxdbCollectionService;

  beforeEach(() => {
    // setupNavigationWarnStub();
    /*
    @Directive({ selector: 'lazy' })
    class LazyComponent {}

    @NgModule({
      declarations: [LazyComponent],
      imports: [NgxRxdbModule.forFeature(TEST_FEATURE_CONFIG_1)],
    })
    class LazyModule {}
    const lazyModuleRoute = [
      {
        path: 'todos',
        loadChildren: () => Promise.resolve(LazyModule),
      },
    ];

    let ngZone: NgZone;
    let router: Router;
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([]),
        NgxRxdbModule.forRoot(TEST_DB_CONFIG_1),
      ],
      providers: [
        { provide: NgxRxdbService, useClass: MockNgxRxdbService },
        NgxRxdbCollectionService,
      ],
    });
    ngZone = TestBed.inject(NgZone);
    router = TestBed.inject(Router);
    dbService = TestBed.inject(NgxRxdbService);
    await TestBed.inject(ApplicationInitStatus).donePromise; */

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

  /** FIXME: I can't write test for lazy module ;(   */
  /* it(
    `should init database ONLY`,
    waitForAsync(() => {
      expect(dbService).toBeDefined();
      expect(dbService.db).toBeDefined();
      // expect(service).toBeUndefined();
    })
  ); */
  /* xit(
    `should provide itself via lazy-loaded feature module`,
    waitForAsync(() => {
      ngZone.run(() => {
        router.initialNavigation();
        router.resetConfig(lazyModuleRoute);
        router.navigateByUrl('/todos').then(r => {
          tick(250);
          flushMicrotasks();
          expect(NgxRxdbFeatureModule).toBeDefined();
          service = TestBed.inject(
            NgxRxdbCollectionService,
            new NgxRxdbCollectionService(dbService, TEST_FEATURE_CONFIG_1),
            InjectFlags.Self
          );
          expect(service).toBeDefined();
          // expect(initializedSpy).toHaveBeenCalled();
          flush();
        });
      });
    })
  ); */
});

describe(`NgxRxdbCollectionService :: inited by db config`, () => {
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
