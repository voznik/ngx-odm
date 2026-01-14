import { Location } from '@angular/common';
import {
  EnvironmentProviders,
  InjectionToken,
  NgZone,
  Provider,
  inject,
  provideAppInitializer,
} from '@angular/core';
import { Router } from '@angular/router';
import { RxDBCollectionService } from '@ngx-odm/rxdb/collection';
import type { RxCollectionCreatorExtended } from '@ngx-odm/rxdb/config';
import { MangoQueryParams } from '@ngx-odm/rxdb/config';
import { RxDBService } from '@ngx-odm/rxdb/core';
import { RxDatabaseCreator } from 'rxdb';
import { BehaviorSubject, Observable, defer, distinctUntilChanged } from 'rxjs';

/**
 * Instance of RxDB service
 */
export const RXDB = new InjectionToken<RxDBService>('RxDBService Instance', {
  providedIn: 'root',
  factory: () => new RxDBService(),
});

/**
 * Instance of RxDatabaseCreator
 */
export const RXDB_CONFIG = new InjectionToken<RxDatabaseCreator>('RxDatabaseCreator');

/**
 * Instance of RxCollectionCreator
 */
/* prettier-ignore */
export const RXDB_CONFIG_COLLECTION = new InjectionToken<RxCollectionCreatorExtended>('RxCollectionCreator');

/**
 * Injection token for Service for interacting with a RxCollection.
 * This token is used to inject an instance of RxDBCollectionService into a component or service.
 */
export const RXDB_COLLECTION = new InjectionToken<RxDBCollectionService>(
  'RxDBCollectionService'
);

/**
 * Initializes DB at `APP_INITIALIZER` cycle
 * @param dbService
 * @param dbConfig
 */
function dbInitializerFactory(
  dbService: RxDBService,
  dbConfig: RxDatabaseCreator
): () => Promise<void> {
  return async () => {
    await dbService.initDb(dbConfig);
  };
}

/**
 * Returns the set of [dependency-injection providers](guide/glossary#provider)
 * to use RxDb in an application
 * @param config
 * @description
 *
 * The function is useful when you want to use RxDb in an application
 * bootstrapped using the `bootstrapApplication` function. In this scenario there
 * is no need to import the `NgxRxdbModule` NgModule at all, just add
 * providers returned by this function to the `providers` list as show below.
 *
 * ```typescript
 * bootstrapApplication(RootComponent, {
 *   providers: [
 *     provideRxDatabase(config)
 *   ]
 * });
 * ```
 */
export function provideRxDatabase(
  config: RxDatabaseCreator
): (Provider | EnvironmentProviders)[] {
  return [
    { provide: RXDB_CONFIG, useValue: config },
    provideAppInitializer(() => {
      const initializerFn = dbInitializerFactory(inject(RXDB), inject(RXDB_CONFIG));
      return initializerFn();
    }),
  ];
}

/**
 * Returns the set of [dependency-injection providers](guide/glossary#provider)
 * to use RxCollection in a standalone component
 * @param collectionConfig
 * @description
 *
 * The function initializes providers for a specific RxDB collection for a standalone component. In this scenario there is no need to import the `NgxRxdbFeatureModule` NgModule at all, just add
 * providers returned by this function to the `providers` list as show below.
 *
 * ```typescript
 * @Component({
 *   selector: 'demo-todo',
 *   templateUrl: 'todo.component.html',
 *   standalone: true,
 *   imports: [MatCheckboxModule, MatIconModule, MatTableModule],
 *   providers: [provideRxCollection(config)]
 * })
 * export class TodoComponent {
 * ```
 */
export function provideRxCollection(
  collectionConfig: RxCollectionCreatorExtended
): Provider[] {
  return [
    { provide: RXDB_CONFIG_COLLECTION, useValue: collectionConfig },
    {
      provide: RXDB_COLLECTION,

      // @ts-ignore // INFO: no need for typings here, nothing's exposed, but ts complains // NOSONAR
      useFactory: (config, dbService, ngZone, currentUrl, updateQueryParamsFn) =>
        new RxDBCollectionService(
          config,
          dbService,
          ngZone,
          currentUrl,
          updateQueryParamsFn
        ),
      deps: [
        //
        RXDB_CONFIG_COLLECTION,
        RXDB,
        NgZone,
        CURRENT_URL,
        updateQueryParams,
      ],
    },
  ];
}

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
