import { CommonModule } from '@angular/common';
import { Inject, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LetDirective, PushPipe } from '@ngrx/component';
import { NgxRxdbModule } from '@ngx-odm/rxdb';
import { NgxRxdbCollection, NgxRxdbCollectionService } from '@ngx-odm/rxdb/collection';
import { TodosComponent } from './todos.component';
import { TODOS_COLLECTION_CONFIG } from './todos.config';
import { Todo } from './todos.model';
import { TodosPipe } from './todos.pipe';
import { todosReplicationStateFactory } from './todos.replication';
import { TodosService } from './todos.service';

TODOS_COLLECTION_CONFIG.options.replicationStateFactory = todosReplicationStateFactory;

@NgModule({
  imports: [
    RouterModule.forChild([{ path: '', component: TodosComponent }]),
    CommonModule,
    FormsModule,
    LetDirective,
    PushPipe,
    NgxRxdbModule.forFeature(TODOS_COLLECTION_CONFIG), // creates RxDB collection from config
  ],
  declarations: [TodosComponent, TodosPipe],
  providers: [TodosService],
})
export class TodosModule {
  constructor(
    @Inject(NgxRxdbCollectionService) private collectionService: NgxRxdbCollection<Todo>
  ) {
    this.collectionService.sync();
  }
}
