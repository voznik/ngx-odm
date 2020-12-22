import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxRxdbModule } from '@ngx-odm/rxdb';
import { TodosComponent } from './components/todos/todos.component';
import { TODOS_COLLECTION_CONFIG } from './models';
import { TodosService } from './services';
import { TodosRoutingModule } from './todos-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TodosRoutingModule,
    NgxRxdbModule.forFeature(TODOS_COLLECTION_CONFIG),
  ],
  declarations: [TodosComponent],
  providers: [TodosService],
})
export class TodosModule {}
