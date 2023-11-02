import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';
import { NgxRxdbModule } from '@ngx-odm/rxdb';
import { getRxDatabaseCreator } from '@ngx-odm/rxdb/config';
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
        localDocuments: true,
        multiInstance: true,
        ignoreDuplicate: false,
        options: {
          storageType: 'dexie',
          dumpPath: 'assets/data/db.dump.json',
        },
      })
    ),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
