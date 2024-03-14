import { CommonModule } from '@angular/common';
import { Inject, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LetDirective, PushPipe } from '@ngrx/component';
import { NgxRxdbCollectionService, NgxRxdbModule } from '@ngx-odm/rxdb';
import { RxDBCollectionService } from '@ngx-odm/rxdb/collection';
import { TODOS_COLLECTION_CONFIG, Todo } from '@shared';
import { TodosComponent } from './todos.component';
import { TodosPipe } from './todos.pipe';
import { TodosService } from './todos.service';

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
    @Inject(NgxRxdbCollectionService) private collectionService: RxDBCollectionService<Todo>
  ) {
    this.collectionService.sync();
  }
}
