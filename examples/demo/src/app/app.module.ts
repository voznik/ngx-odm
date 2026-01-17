import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';
import { NgxRxdbModule } from '@ngx-odm/rxdb';
import { getRxDatabaseCreator } from '@ngx-odm/rxdb/config';
import { environment, provideDbErrorHandler } from '@shared';
import { addRxPlugin } from 'rxdb';
import { RxDBAttachmentsPlugin } from 'rxdb/plugins/attachments';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import { AppComponent } from './app.component';

if (!environment.production) {
  import('rxdb/plugins/dev-mode').then(m => addRxPlugin(m.RxDBDevModePlugin));
}

const routes: Routes = [
  {
    path: 'todos',
    loadChildren: () => import('./todos/todos.module').then(mod => mod.TodosModule),
  },
  {
    path: '',
    redirectTo: 'todos',
    pathMatch: 'full',
  },
];

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(routes),
    NgxRxdbModule.forRoot(
      getRxDatabaseCreator({
        name: 'demo',
        localDocuments: false,
        multiInstance: true,
        ignoreDuplicate: false,
        options: {
          plugins: [
            // RxDBDevModePlugin is loaded dynamically above in dev mode only
            RxDBAttachmentsPlugin,
            RxDBLeaderElectionPlugin,
          ],
          storageType: localStorage['_ngx_rxdb_storage'] ?? 'dexie',
          dumpPath: 'assets/data/db.dump.json',
        },
      })
    ),
  ],
  providers: [provideDbErrorHandler()],
  bootstrap: [AppComponent],
})
export class AppModule {}
