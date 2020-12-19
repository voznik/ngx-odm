import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';
import { NgxRxdbConfig, NgxRxdbModule } from '@ngx-odm/rxdb';
import { AppComponent } from './app.component';

/** NgxRxdbConfig extends RxDatabaseCreator, will be merged with default config */
const APP_RXDB_CONFIG: NgxRxdbConfig = {
  name: 'demo', // <- name (required, 'ngx')
  adapter: 'idb', // <- storage-adapter (required, default: 'idb')
  multiInstance: true,
  options: {
    dumpPath: 'assets/data/db.dump.json',
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
    RouterModule.forRoot(routes),
    NgxRxdbModule.forRoot(APP_RXDB_CONFIG),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
