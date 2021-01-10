import { ApplicationInitStatus } from '@angular/core';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { addRxPlugin } from 'rxdb/plugins/core';
import { TEST_DB_CONFIG_1, TEST_DB_CONFIG_2 } from './rxdb.mock';
import { NgxRxdbModule } from './rxdb.module';
import { NgxRxdbService } from './rxdb.service';

addRxPlugin(require('pouchdb-adapter-node-websql'));

describe('NgxRxdbService', () => {
  describe(`:: init`, () => {
    let service: NgxRxdbService;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [NgxRxdbModule.forRoot(TEST_DB_CONFIG_1)],
      });
      service = TestBed.inject(NgxRxdbService);
    });

    it(`should init database`, () => {
      expect(service).toBeDefined();
    });
  });

  describe(`:: init db AND col`, () => {
    let service: NgxRxdbService;

    beforeEach(async () => {
      TestBed.configureTestingModule({
        imports: [NgxRxdbModule.forRoot(TEST_DB_CONFIG_2)],
      });
      service = TestBed.inject(NgxRxdbService);
      await TestBed.inject(ApplicationInitStatus).donePromise;
    });
    it(
      `should init database AND collection`,
      waitForAsync(() => {
        expect(service.db).toBeDefined();
        expect(service.db.name).toBeDefined();
        // expect(service.db.name).toEqual(TEST_DB_CONFIG_2.name);
        expect(service.db.collections['todo']).toBeDefined();
        // expect(service.db.collections['todo']?.statics?.countAllDocuments).toBeInstanceOf(Function);
      })
    );
  });
});
