import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '@app/shared/shared.module';
import { NgxRxdbModule } from 'ngx-rxdb';
import { TodosContainerComponent } from './components';
import { TODO_SCHEMA } from './models';
import { TodosService } from './services';
import { TodosRoutingModule } from './todos-routing.module';
import { TodosComponent } from './todos.component';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TodosRoutingModule,
    SharedModule,
    NgxRxdbModule.forFeature(TODO_SCHEMA),
  ],
  declarations: [TodosComponent, TodosContainerComponent],
  providers: [TodosService],
})
export class TodosModule {
  constructor() {}
}
