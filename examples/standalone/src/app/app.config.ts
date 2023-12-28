/* eslint-disable @typescript-eslint/no-unused-vars */
import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, NgZone, ɵNoopNgZone } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideRxDatabase } from '@ngx-odm/rxdb';
import { getRxDatabaseCreator } from '@ngx-odm/rxdb/config';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: NgZone, useClass: ɵNoopNgZone },
    provideRouter(appRoutes, withComponentInputBinding()),
    provideAnimationsAsync(),
    provideHttpClient(),
    provideRxDatabase(
      getRxDatabaseCreator({
        name: 'demo',
        localDocuments: true,
        multiInstance: true,
        ignoreDuplicate: false,
        // storage: getRxStorageDexie(), // INFO: can be ommited, will be provide by `storageType` string
        options: {
          storageType: localStorage['_ngx_rxdb_storage'] ?? 'dexie',
          dumpPath: 'assets/data/db.dump.json',
        },
      })
    ),
  ],
};
