import { async, TestBed } from '@angular/core/testing';
import { NgxKintoModule } from './kinto.module';

describe('KintoModule', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [NgxKintoModule],
    }).compileComponents();
  }));

  // TODO: Add real tests here.
  //
  // NB: This particular test does not do anything useful.
  //     It does NOT check for correct instantiation of the module.
  it('should have a module definition', () => {
    expect(NgxKintoModule).toBeDefined();
  });
});
