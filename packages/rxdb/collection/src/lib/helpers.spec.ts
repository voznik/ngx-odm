import { ReplaySubject, of } from 'rxjs';
import { ensureCollection, ensureCollection$ } from './helpers';

describe('ensureCollection', () => {
  let initialized: ReplaySubject<any>;
  let testInstance: TestClass;

  class TestClass {
    get initialized$() {
      return initialized.asObservable();
    }

    get config() {
      return { name: 'testCollection' };
    }

    @ensureCollection()
    async asyncMethod() {
      return true;
    }

    @ensureCollection$()
    rxMethod() {
      return of(true);
    }
  }

  beforeEach(() => {
    initialized = new ReplaySubject();
    testInstance = new TestClass();
  });

  it('should throw an error if the collection is not initialized', async () => {
    const errorMessage = `Collection "testCollection" was not initialized. Please check RxDB errors.`;
    initialized.complete();
    await expect(testInstance.asyncMethod()).rejects.toThrow(errorMessage);
  });

  it('should call async method after the collection was initialized', async () => {
    const originalMethod = jest.spyOn(testInstance, 'asyncMethod');
    initialized.next(true);
    initialized.complete();

    const result = await testInstance.asyncMethod();
    expect(originalMethod).toHaveBeenCalled();
    expect(result).toBeTruthy();
  });

  it('should call rxjs method after the collection was initialized', done => {
    const originalMethod = jest.spyOn(testInstance, 'rxMethod');
    initialized.next(true);
    initialized.complete();

    testInstance.rxMethod().subscribe(result => {
      expect(originalMethod).toHaveBeenCalled();
      expect(result).toBeTruthy();
      done();
    });
  });
});
