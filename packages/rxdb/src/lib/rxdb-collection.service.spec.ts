/* eslint-disable no-console */
import { TestBed, waitForAsync } from '@angular/core/testing';
import { NgxRxdbConfig, NgxRxdbCollectionConfig } from './rxdb.d';
import { NgxRxdbModule } from './rxdb.module';
import { NgxRxdbCollectionService } from './rxdb-collection.service';
import { TEST_DB_CONFIG_1, TEST_DB_CONFIG_2, TEST_FEATURE_CONFIG_1 } from './rxdb.mock';
import { ApplicationInitStatus } from '@angular/core';

describe(`NgxRxdbCollectionService :: init`, () => {
  let service: NgxRxdbCollectionService;
  let initializedSpy;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [
        NgxRxdbModule.forRoot(TEST_DB_CONFIG_1),
        NgxRxdbModule.forFeature(TEST_FEATURE_CONFIG_1),
      ],
    });
    service = TestBed.inject(NgxRxdbCollectionService);
    initializedSpy = jest.spyOn(service, 'initialized$');
    await TestBed.inject(ApplicationInitStatus).donePromise;
  });

  it(
    `should provide itself via feature module`,
    waitForAsync(() => {
      expect(service).toBeDefined();
      // expect(initializedSpy).toHaveBeenCalled(); // FIXME: IDK how
    })
  );
});

describe(`NgxRxdbCollectionService :: init db AND col`, () => {
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
    service.initialized$().subscribe(() => {
      console.log('s');
    });
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
