import {
  ApplicationInitStatus,
  APP_INITIALIZER,
  Inject,
  ModuleWithProviders,
  NgModule,
  Optional,
  Self,
  SkipSelf,
} from '@angular/core';
import {
  NgxRxdbFeatureModule,
  NgxRxdbCollectionService,
  collectionServiceFactory,
} from '@ngx-odm/rxdb/collection';
import {
  NgxRxdbCollectionConfig,
  NgxRxdbConfig,
  RXDB_CONFIG,
  RXDB_CONFIG_COLLECTION,
} from '@ngx-odm/rxdb/config';
import { NgxRxdbService } from '@ngx-odm/rxdb/core';
import { from } from 'rxjs';

/**
 * run at APP_INITIALIZER cycle
 * @param dbService
 * @param dbConfig
 */
export function dbInitializerFactory(
  dbService: NgxRxdbService,
  dbConfig: NgxRxdbConfig
): () => Promise<void> {
  return async () => {
    await dbService.initDb(dbConfig);
  };
}

/**
 * Main module which should be imported once in app module, will init RxDbDatabase with given configuration
 *
 * ### Installation
 *
 * 1) Import `NgxRxdbModule` to your root module.
 *
 ```typescript
    @NgModule({
      imports: [
        // ...
        NgxRxdbModule.forRoot({
          name: 'demo',          // <- name (required, 'ngx')
          adapter: 'idb',        // <- storage-adapter (required, default: 'idb')
          multiInstance: true,   // <-(optional)
          options: {
            dumpPath: 'assets/data/db.dump.json', // <- remote url (optional)
          },
        })
      ],
    })
    export class AppModule { }
 ```
 *
 * 2) Import `NgxRxdbModule` to your feature module.
 *
 ```typescript
  @NgModule({
    imports: [
      // ...
      NgxRxdbModule.forFeature({
        name: 'todo',
        // schema: todoSchema, <-(kind of optional)
        statics: {}, // <-(optional)
        options: { // <-(optional)
          schemaUrl: 'assets/data/todo.schema.json', <- remote url (optional)
          initialDocs: initialState.items, // <-(optional)
        },
      })
    ]
  }),
  export class TodosModule { }
 ```
 * ### Usage
 *
 * Example of usage:
 * <example-url>http://localhost/demo/mysample.component.html</example-url>
 * <example-url>../index.html</example-url>
 */
@NgModule({
  // id: 'NgxRxdbModule',
})
export class NgxRxdbModule {
  static forFeature(
    collectionConfig: NgxRxdbCollectionConfig
  ): ModuleWithProviders<NgxRxdbFeatureModule> {
    return {
      ngModule: NgxRxdbFeatureModule,
      providers: [
        { provide: RXDB_CONFIG_COLLECTION, useValue: collectionConfig, multi: true },
        {
          provide: NgxRxdbCollectionService,
          useFactory: collectionServiceFactory(collectionConfig),
          deps: [NgxRxdbService],
        },
      ],
    };
  }

  static forRoot(config: NgxRxdbConfig): ModuleWithProviders<NgxRxdbModule> {
    return {
      ngModule: NgxRxdbModule,
      providers: [
        { provide: RXDB_CONFIG, useValue: config },
        NgxRxdbService,
        {
          provide: APP_INITIALIZER,
          useFactory: dbInitializerFactory,
          deps: [NgxRxdbService, RXDB_CONFIG],
          multi: true,
        },
      ],
    };
  }

  /**
   * Prevents this module from being incorrectly imported
   * @param appInitStatus - A class that reflects the state of
   * running {@link https://v7.angular.io/api/core/APP_INITIALIZER|APP_INITIALIZER}s.
   * @param ngxRxdbConfig - The configuration of the `NgxRxdbModule`
   * @param trueNgxRxdbConfig
   * @param ngxRxdbService
   */
  public constructor(
    appInitStatus: ApplicationInitStatus,
    @Optional() @SkipSelf() @Inject(RXDB_CONFIG) ngxRxdbConfig: NgxRxdbConfig,
    @Optional() @Self() @Inject(RXDB_CONFIG) trueNgxRxdbConfig: NgxRxdbConfig,
    @Optional() @SkipSelf() @Self() ngxRxdbService: NgxRxdbService
  ) {
    if (!trueNgxRxdbConfig && !ngxRxdbConfig) {
      throw new Error(
        `${RXDB_CONFIG.toString()} is not provided. Make sure you call the 'forRoot' method of the NgxRxdbModule in the AppModule only.`
      );
    }

    if (trueNgxRxdbConfig && ngxRxdbConfig) {
      throw new Error(
        `${RXDB_CONFIG.toString()} is already provided. Make sure you call the 'forRoot' method of the NgxRxdbModule in the AppModule only.`
      );
    }

    // TODO: initialize the service only when this is a Root module ('forRoot' was called)
    if (trueNgxRxdbConfig && !ngxRxdbConfig) {
      from(appInitStatus.donePromise).subscribe(() => {
        // doSmth
      });
    }
  }
}
