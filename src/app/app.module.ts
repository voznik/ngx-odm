import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';
import { NgxRxdbModule } from 'ngx-rxdb';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';

const routes: Routes = [
  {
    path: 'todos',
    loadChildren: './todos/todos.module#TodosModule'
  }
];

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(routes),
    CoreModule,
    SharedModule,
    NgxRxdbModule.forRoot({ name: 'ngx'}),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
