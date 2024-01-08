import {
  ApplicationInitStatus,
  Inject,
  Injector,
  ModuleWithProviders,
  NgModule,
  Optional,
  Self,
  SkipSelf,
} from '@angular/core';
import { NgxRxdbFeatureModule } from '@ngx-odm/rxdb/collection';
import { RXDB_CONFIG, RxCollectionCreatorExtended } from '@ngx-odm/rxdb/config';
import { NgxRxdbService } from '@ngx-odm/rxdb/core';
import { NgxRxdbUtils } from '@ngx-odm/rxdb/utils';
import type { RxDatabaseCreator } from 'rxdb';
import { provideRxCollection, provideRxDatabase } from './rxdb.providers';

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
@NgModule()
export class NgxRxdbModule {
  /**
   * Creates a feature module with providers for a specific RxDB collection.
   * @param collectionConfig The configuration for the RxDB collection.
   */
  static forFeature(
    collectionConfig: RxCollectionCreatorExtended
  ): ModuleWithProviders<NgxRxdbFeatureModule> {
    return {
      ngModule: NgxRxdbFeatureModule,
      providers: provideRxCollection(collectionConfig),
    };
  }

  /**
   * Configures and initializes RxDB with the given configuration, during the `APP_INITIALIZER` cycle.
   * @param config The configuration options for NgxRxdbModule.
   */
  static forRoot(config: RxDatabaseCreator): ModuleWithProviders<NgxRxdbModule> {
    return {
      ngModule: NgxRxdbModule,
      providers: provideRxDatabase(config),
    };
  }

  /**
   * Prevents this module from being incorrectly imported
   * @param appInitStatus - A class that reflects the state of
   * running {@link https://v7.angular.io/api/core/APP_INITIALIZER|APP_INITIALIZER}s.
   * @param ngxRxdbConfig - The configuration of the `NgxRxdbModule`
   * @param trueNgxRxdbConfig
   * @param injector
   */
  public constructor(
    appInitStatus: ApplicationInitStatus,
    @Optional() @SkipSelf() @Inject(RXDB_CONFIG) ngxRxdbConfig: RxDatabaseCreator,
    @Optional() @Self() @Inject(RXDB_CONFIG) trueNgxRxdbConfig: RxDatabaseCreator,
    injector: Injector
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

    if (trueNgxRxdbConfig && !ngxRxdbConfig) {
      appInitStatus.donePromise.then(() => {
        const ngxRxdbService = injector.get(NgxRxdbService);
        if (ngxRxdbService.db.startupErrors.length) {
          NgxRxdbUtils.logger.log(ngxRxdbService.db.startupErrors);
        }
        NgxRxdbUtils.logger.log(
          `database "${ngxRxdbService.db.name}" ready, rxdb version is "${ngxRxdbService.db['rxdbVersion']}", storage is "${ngxRxdbService.db.storage.name}"`
        );
      });
    }
  }
}
