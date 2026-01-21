import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { provideRxCollection } from '@ngx-odm/rxdb';
import { Todo, TODOS_COLLECTION_CONFIG, todosListAnimation } from '@shared';
import { TodoStore } from './todos.store';

@Component({
  selector: 'app-todos',
  templateUrl: './todos.component.html',
  styleUrls: ['./todos.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [todosListAnimation],
  imports: [CommonModule],
  providers: [
    provideRxCollection(TODOS_COLLECTION_CONFIG), // Collection will be created via this injection
    TodoStore,
  ],
})
export class TodosComponent {
  private titleService = inject(Title);
  readonly todoStore = inject(TodoStore);

  trackByFn = (index: number, item: Todo) => {
    return item.id + item.last_modified;
  };

  constructor() {
    effect(() => {
      const titleString = this.todoStore.title();
      this.titleService.setTitle(titleString);
    });
  }
}
