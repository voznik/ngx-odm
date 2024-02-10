import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';
import { NgxRxdbModule } from '@ngx-odm/rxdb';
import { getRxDatabaseCreator } from '@ngx-odm/rxdb/config';
import { RxDBAttachmentsPlugin } from 'rxdb/plugins/attachments';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import { AppComponent } from './app.component';

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
            // will be loaded by together with core plugins
            RxDBAttachmentsPlugin,
            RxDBLeaderElectionPlugin,
          ],
          storageType: localStorage['_ngx_rxdb_storage'] ?? 'dexie',
          dumpPath: 'assets/data/db.dump.json',
        },
      })
    ),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
