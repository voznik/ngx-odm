// tslint:disable:member-access array-type max-classes-per-file
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
import { NgxRxdbCollectionService } from './rxdb-collection.service';
import { NgxRxdbCollectionConfig, NgxRxdbConfig } from './rxdb.interface';
import { NgxRxdbService } from './rxdb.service';
import { RXDB_CONFIG, RXDB_FEATURE_CONFIG } from './rxdb.token';
import { logFn, noop } from './utils';

/** run at APP_INITIALIZER cycle */
export function dbInitializerFactory(
  rxdb: NgxRxdbService,
  config: NgxRxdbConfig
): () => Promise<void> {
  return async () => {
    await rxdb.initDb(config);
  };
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
// "dynamic"
@NgModule()
export class NgxRxdbModule {
  static forFeature(
    config: NgxRxdbCollectionConfig
  ): ModuleWithProviders<NgxRxdbFeatureModule> {
    return {
      ngModule: NgxRxdbFeatureModule,
      providers: [
        {
          provide: RXDB_FEATURE_CONFIG,
          useValue: config,
        },
        NgxRxdbCollectionService,
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
   * @param appInitStatus - A class that reflects the state of running {@link https://v7.angular.io/api/core/APP_INITIALIZER|APP_INITIALIZER}s.
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
    @Inject(RXDB_FEATURE_CONFIG)
    ngxRxdbCollectionConfig: NgxRxdbCollectionConfig,
    @Self() ngxRxdbService: NgxRxdbService
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
        // logFn('appInitStatus.donePromise');
      });
    }
  }
}
/**
 * feature module which should be imported in lazy feature modules, will init RxDbCollection with given configuration
 */
@NgModule({})
export class NgxRxdbFeatureModule {
  constructor(public collectionService: NgxRxdbCollectionService<any>) {
    // init collection via loader
    this.collectionService.collectionLoaded$().subscribe(noop);
  }
}
