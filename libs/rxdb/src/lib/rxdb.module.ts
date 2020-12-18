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

export function dbInitializerFactory(
  rxdb: NgxRxdbService,
  config: NgxRxdbConfig
): () => Promise<void> {
  return async () => {
    await rxdb.initDb(config);
  };
}
/**
 * main module which should be imported once in app module, will init RxDbDatabase with given configuration
 */
// @dynamic
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
      // this logic cannot be executed in an APP_INITIALIZER factory
      // so this is done via appInitStatus.donePromise
      from(appInitStatus.donePromise).subscribe(() => {
        logFn('appInitStatus.donePromise');
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
