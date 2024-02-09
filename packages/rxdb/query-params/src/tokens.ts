import { Location } from '@angular/common';
import { InjectionToken, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MangoQueryParams } from '@ngx-odm/rxdb/config';
import { Observable, BehaviorSubject, defer, distinctUntilChanged } from 'rxjs';

/**
 * The current URL as an observable
 */
export const CURRENT_URL = new InjectionToken<Observable<string>>('CURRENT_URL', {
  providedIn: 'root',
  factory: () => {
    const location = inject(Location);
    const subject = new BehaviorSubject(window.location.href);

    location.onUrlChange(url => {
      subject.next(url);
    });
    return defer(() => subject).pipe(distinctUntilChanged());
  },
});

/**
 * Updates query params in the URL via {@link Router.navigate }
 */
export const updateQueryParams = new InjectionToken<
  (queryParams: MangoQueryParams) => Promise<boolean>
>('UPDATE_QUERY_PARAMS', {
  providedIn: 'root',
  factory: () => {
    const router = inject(Router);
    return (queryParams: MangoQueryParams) => {
      return router.navigate([], {
        queryParams,
        queryParamsHandling: 'merge',
      });
    };
  },
});
