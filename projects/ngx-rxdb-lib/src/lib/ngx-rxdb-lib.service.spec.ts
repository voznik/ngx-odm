import { TestBed } from '@angular/core/testing';

import { NgxRxdbLibService } from './ngx-rxdb-lib.service';

describe('NgxRxdbLibService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: NgxRxdbLibService = TestBed.get(NgxRxdbLibService);
    expect(service).toBeTruthy();
  });
});
