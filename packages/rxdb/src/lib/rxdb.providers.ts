import { Provider, APP_INITIALIZER } from '@angular/core';
import {
  NgxRxdbCollection,
  NgxRxdbCollectionService,
  collectionServiceFactory,
} from '@ngx-odm/rxdb/collection';
import {
  RXDB_CONFIG,
  RxCollectionCreatorExtended,
  RXDB_CONFIG_COLLECTION,
} from '@ngx-odm/rxdb/config';
import { NgxRxdbService } from '@ngx-odm/rxdb/core';
import { RxDatabaseCreator } from 'rxdb';

/**
 * Initializes DB at `APP_INITIALIZER` cycle
 * @param dbService
 * @param dbConfig
 */
function dbInitializerFactory(
  dbService: NgxRxdbService,
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
export function provideRxDatabase(config: RxDatabaseCreator): Provider[] {
  return [
    { provide: RXDB_CONFIG, useValue: config },
    {
      provide: APP_INITIALIZER,
      useFactory: dbInitializerFactory,
      deps: [NgxRxdbService, RXDB_CONFIG],
      multi: true,
    },
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
    { provide: RXDB_CONFIG_COLLECTION, useValue: collectionConfig, multi: true },
    {
      provide: NgxRxdbCollectionService,
      useFactory: collectionServiceFactory(collectionConfig),
      deps: [NgxRxdbService],
    },
  ];
}
