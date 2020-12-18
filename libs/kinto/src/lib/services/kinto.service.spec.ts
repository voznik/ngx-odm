import { TestBed } from '@angular/core/testing';

import { NgxKintoService, NGX_KINTO_OPTIONS } from './kinto.service';

describe('KintoService', () => {
  let service: NgxKintoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: NGX_KINTO_OPTIONS, useValue: {} },
        NgxKintoService,
      ],
    });
    service = TestBed.inject(NgxKintoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
