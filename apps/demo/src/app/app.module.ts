import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';
import { NgxRxdbConfig, NgxRxdbModule } from '@ngx-odm/rxdb';
import { AppComponent } from './app.component';

const APP_RXDB_CONFIG: NgxRxdbConfig = {
  // optional, NgxRxdbConfig extends RxDatabaseCreator, will be merged with default config
  name: 'demo', // <- name (optional, 'ngx')
  adapter: 'idb', // <- storage-adapter (optional, default: 'idb')
  ignoreDuplicate: true,
  multiInstance: true,
  options: {},
};

const routes: Routes = [
  {
    path: 'todos',
    loadChildren: () =>
      import('./todos/todos.module').then(mod => mod.TodosModule),
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
