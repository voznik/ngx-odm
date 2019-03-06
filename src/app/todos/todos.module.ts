import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Inject, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '@app/shared/shared.module';
import { NgxRxdbModule, NgxRxdbCollectionConfig } from 'ngx-rxdb';
import { TodosContainerComponent } from './components';
import { initialState, Todo, TODO_SCHEMA } from './models';
import { TodosService } from './services';
import { TodosRoutingModule } from './todos-routing.module';
import { TodosComponent } from './todos.component';

const todoCollectionConfig: NgxRxdbCollectionConfig = {
  ...TODO_SCHEMA, options: { ...TODO_SCHEMA.options, initialDocs: initialState.items }
};

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TodosRoutingModule,
    SharedModule,
    NgxRxdbModule.forFeature(todoCollectionConfig),
  ],
  declarations: [TodosComponent, TodosContainerComponent],
  providers: [TodosService],
})
export class TodosModule {
  constructor() {}
}
