// tslint:disable:member-access array-type max-classes-per-file
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, Inject, InjectionToken, Injector, ModuleWithProviders, NgModule } from '@angular/core';
import RxDB from 'rxdb/plugins/core';
import { forkJoin, Observable } from 'rxjs';
import { NgxRxdbCollectionService } from './ngx-rxdb-collection.service';
import { NgxRxdbCollectionConfig, NgxRxdbConfig } from './ngx-rxdb.interface';
import { NgxRxdbLibService } from './ngx-rxdb.service';

export const RXDB_CONFIG = new InjectionToken<NgxRxdbConfig>('RXDB_CONFIG');

export function dbInitializerFactory(rxdb: NgxRxdbLibService, http: HttpClient, injector: Injector): any {
  const config: NgxRxdbConfig = injector.get('RXDB_CONFIG');
  return async () => {
    await rxdb.initDb(config);
    // TODO: import
    /* try {
      // INFO: get jsonSchemas via http instead import, fixes aot build
      const schemasRequests: Observable<any>[] = config.schemas.map(cs => http.get(cs.url));
      const schemasResult = await forkJoin(schemasRequests).toPromise();
      const schemas = config.schemas.map((cs, i) => ({...cs, schema: schemasResult[i]}));
      const dump = await http.get(config.dumpPath).toPromise();
      await rxdb.initCollections(schemas, dump);
      console.log('NgxRxdbLibService: initCollections - done');
    } catch (error) {
      console.log('NgxRxdbLibService: error init', error);
    } */
  };
}

@NgModule({
  imports: [
    /* HttpClientModule */
  ],
})
export class NgxRxdbLibModule {
  constructor(private rxdb: NgxRxdbLibService) {}

  static forFeature(config: NgxRxdbCollectionConfig): ModuleWithProviders {
    return {
      ngModule: NgxRxdbFeatureModule,
      providers: [{ provide: 'RXDB_FEATURE_CONFIG', useValue: config /* , multi: true */ }, NgxRxdbCollectionService],
    };
  }

  static forRoot(config: NgxRxdbConfig): ModuleWithProviders {
    return {
      ngModule: NgxRxdbLibModule,
      providers: [
        { provide: 'RXDB_CONFIG', useValue: config },
        NgxRxdbLibService,
        {
          provide: APP_INITIALIZER,
          useFactory: dbInitializerFactory,
          deps: [NgxRxdbLibService, HttpClient, Injector],
          multi: true,
        },
      ],
    };
  }

}

@NgModule({})
export class NgxRxdbFeatureModule {
  constructor(
    private collectionService: NgxRxdbCollectionService<any>,
    @Inject('RXDB_FEATURE_CONFIG') private config: NgxRxdbCollectionConfig
  ) {
    // init collection via loader
    this.collectionService.collectionLoaded$().subscribe(() => {});
  }
}
