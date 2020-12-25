/* eslint-disable @angular-eslint/directive-class-suffix */
/* eslint-disable no-console */
import {
  ApplicationInitStatus,
  Directive,
  InjectFlags,
  NgModule,
  NgModuleFactoryLoader,
  NgZone,
} from '@angular/core';
import {
  fakeAsync,
  flushMicrotasks,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NgxRxdbCollectionService } from './rxdb-collection.service';
import { TEST_DB_CONFIG_1, TEST_DB_CONFIG_2, TEST_FEATURE_CONFIG_1 } from './rxdb.mock';
import { NgxRxdbModule } from './rxdb.module';
import { NgxRxdbService } from './rxdb.service';

@Directive({ selector: 'lazy' })
class LazyComponent {}

@NgModule({
  declarations: [LazyComponent],
  imports: [NgxRxdbModule.forFeature(TEST_FEATURE_CONFIG_1)],
})
class LazyModule {}

describe(`NgxRxdbCollectionService :: init`, () => {
  let ngZone: NgZone;
  let router: Router;
  let dbService: NgxRxdbService;
  let service: NgxRxdbCollectionService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([]),
        NgxRxdbModule.forRoot(TEST_DB_CONFIG_1),
      ],
      // providers: [NgxRxdbCollectionService],
    });
    ngZone = TestBed.inject(NgZone);
    router = TestBed.inject(Router);
    dbService = TestBed.inject(NgxRxdbService);
    // loader = TestBed.get(NgModuleFactoryLoader);
    await TestBed.inject(ApplicationInitStatus).donePromise;
  });

  it(`should provide itself via feature module`, fakeAsync(() => {
    ngZone.run(() => {
      router.initialNavigation();
      router.resetConfig([
        {
          path: 'todos',
          loadChildren: () => Promise.resolve(LazyModule),
        },
      ]);
      // tick(100);
      router.navigateByUrl('/todos').then(r => {
        service = TestBed.inject(
          NgxRxdbCollectionService,
          new NgxRxdbCollectionService(dbService, TEST_FEATURE_CONFIG_1),
          InjectFlags.Self
        );
        expect(service).toBeDefined();
      });
      tick();
    });
    flushMicrotasks();
    // expect(initializedSpy).toHaveBeenCalled(); // FIXME: IDK how
  }));

  /* it(
    `should provide itself via feature module`,
    waitForAsync(() => {
      expect(service).toBeDefined();
      // expect(initializedSpy).toHaveBeenCalled(); // FIXME: IDK how
    })
  ); */
});

xdescribe(`NgxRxdbCollectionService :: init db AND col`, () => {
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
    service.initialized$().subscribe(
      () => {
        console.log('s');
      },
      e => {
        console.warn(e);
      }
    );
  });
  it(
    `should init database AND collection`,
    waitForAsync(() => {
      expect(service.db).toBeDefined();
      expect(service.db.name).toEqual(TEST_DB_CONFIG_2.name);
      service.initialized$().subscribe(() => {
        // expect(service.collection).toBeDefined();
        // expect(service.collection?.statics?.countAllDocuments).toBeInstanceOf(Function);
      });
    })
  );
});
