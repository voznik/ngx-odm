import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';
import { NgxRxdbModule } from '@ngx-odm/rxdb';
import { NgxRxdbConfig } from '@ngx-odm/rxdb/config';
import { AppComponent } from './app.component';

/** NgxRxdbConfig extends RxDatabaseCreator, will be merged with default config */
const APP_RXDB_CONFIG: NgxRxdbConfig = {
  name: 'demo', // <- name (required, 'ngx')
  storage: null,
  multiInstance: true,
  options: {
    storageType: 'dexie',
    // dumpPath: 'assets/data/db.dump.json', // <- remote url (optional)
  },
};

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
    NgxRxdbModule.forRoot(APP_RXDB_CONFIG),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
