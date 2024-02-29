import { Location } from '@angular/common';
import { SpyLocation } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MangoQueryParams } from '@ngx-odm/rxdb/config';
import { Observable, take } from 'rxjs';
import { CURRENT_URL, updateQueryParams } from './tokens';

describe('query-params injection tokens', () => {
  describe('CURRENT_URL should emit stream', () => {
    let location: Location;
    let currentUrl$: Observable<string>;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [{ provide: Location, useClass: SpyLocation }],
      });
      location = TestBed.inject(Location);
      currentUrl$ = TestBed.inject(CURRENT_URL);
    });

    it('should emit current URL when it changes', async () => {
      const nextUrl = 'http://localhost:4200/todos?limit=1&skip=1';
      location.go(nextUrl);

      const currentUrl = await currentUrl$.pipe(take(1)).toPromise();
      expect(currentUrl).toMatch(nextUrl);
    });
  });

  describe('should update queryParams via router.navigate', () => {
    let router: Router;
    let spy: jest.SpyInstance;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [Router],
      });
      router = TestBed.inject(Router);
      spy = jest.spyOn(router, 'navigate');
    });

    it('should navigate with updated query parameters', async () => {
      const queryParams: MangoQueryParams = {
        skip: 1,
      };
      const updateQueryParamsFn = TestBed.inject(updateQueryParams);
      await updateQueryParamsFn(queryParams);
      expect(spy).toHaveBeenCalledWith([], {
        queryParams,
        queryParamsHandling: 'merge',
      });
    });
  });
});
