import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  inject,
} from '@angular/core';
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
  private cdr = inject(ChangeDetectorRef);
  private titleService = inject(Title);
  readonly todoStore = inject(TodoStore);
  todos: Todo[] = []; // Copy todos from store inside effect to properly trigger zoneless change detection

  trackByFn = (index: number, item: Todo) => {
    return item.id + item.last_modified;
  };

  constructor() {
    effect(() => {
      const { filtered, title } = this.todoStore;
      this.todos = filtered(); // Copy todos from store inside effect to properly trigger zoneless change detection
      const titleString = title();
      this.titleService.setTitle(titleString);

      // INFO: Angular 17 doesn't provide way to detect changes with `signals` ONLY and no zone
      this.cdr.detectChanges();
    });
  }
}
