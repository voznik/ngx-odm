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
import { from } from 'rxjs';
import { NgxRxdbAsyncNoZonePipe } from './rxdb-async-no-zone.pipe';
import { NgxRxdbCollectionService } from './rxdb-collection.service';
import { NgxRxdbCollectionConfig, NgxRxdbConfig } from './rxdb.interface';
import { NgxRxdbService } from './rxdb.service';
import { RXDB_CONFIG } from './rxdb.token';
import { noop } from './utils';

/** run at APP_INITIALIZER cycle */
export function dbInitializerFactory(
  dbService: NgxRxdbService,
  dbConfig: NgxRxdbConfig
): () => Promise<void> {
  return async () => {
    await dbService.initDb(dbConfig);
  };
}

export function collectionServiceFactory(config: NgxRxdbCollectionConfig) {
  return (dbService: NgxRxdbService): NgxRxdbCollectionService =>
    new NgxRxdbCollectionService(dbService, config);
}

/**
 * Main module which should be imported once in app module, will init RxDbDatabase with given configuration
 *
 * ### Installation
 *
 * 1) Import `NgxRxdbModule` to your root module.
 *
 * ```ts
 * @NgModule({
 *   imports: [
 *     // ...
 *     NgxRxdbModule.forRoot(
 *       {
 *         name: 'demo',          // <- name (required, 'ngx')
 *         adapter: 'idb',        // <- storage-adapter (required, default: 'idb')
 *         multiInstance: true,   // <-(optional)
 *         options: {
 *           dumpPath: 'assets/data/db.dump.json', // <- remote url (optional)
 *         },
 *       })
 *   ],
 * })
 * export class AppModule { }
 * ```
 *
 * 2) Import `NgxRxdbModule` to your feature module.
 *
 * ```ts
 * @NgModule({
 *   imports: [
 *     // ...
 *      NgxRxdbModule.forFeature({
 *       name: 'todo',
 *       // schema: todoSchema, <-(kind of optional)
 *       statics: {}, // <-(optional)
 *       options: { // <-(optional)
 *         schemaUrl: 'assets/data/todo.schema.json', <- remote url (optional)
 *         initialDocs: initialState.items, // <-(optional)
 *       },
 *      })
 *      ]
 * }),
 * export class TodosModule { }
 * ```
 * ### Usage
 *
 * Example of usage:
 * <example-url>http://localhost/demo/mysample.component.html</example-url>
 * <example-url>../index.html</example-url>
 */
// @dynamic
@NgModule()
export class NgxRxdbModule {
  static forFeature(
    collectionConfig: NgxRxdbCollectionConfig
  ): ModuleWithProviders<NgxRxdbFeatureModule> {
    return {
      ngModule: NgxRxdbFeatureModule,
      providers: [
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
   * @param parentModule - The parent module
   * @param ngxRxdbConfig - The configuration of the `NgxRxdbModule`
   */
  public constructor(
    appInitStatus: ApplicationInitStatus,
    @Optional()
    @SkipSelf()
    @Inject(RXDB_CONFIG)
    ngxRxdbConfig: NgxRxdbConfig,
    @Optional()
    @Self()
    @Inject(RXDB_CONFIG)
    trueNgxRxdbConfig: NgxRxdbConfig,
    @Optional()
    @SkipSelf()
    @Self()
    ngxRxdbService: NgxRxdbService
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
/**
 * feature module which should be imported in lazy feature modules, will init RxDbCollection with given configuration
 */
@NgModule({
  declarations: [NgxRxdbAsyncNoZonePipe],
  exports: [NgxRxdbAsyncNoZonePipe],
})
export class NgxRxdbFeatureModule {
  /** also init collection via loader */
  constructor(public collectionService: NgxRxdbCollectionService<any>) {
    this.collectionService.collectionLoaded$().subscribe(noop);
  }
}
