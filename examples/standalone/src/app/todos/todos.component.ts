import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RenderScheduler } from '@ngrx/component';
import { provideRxCollection } from '@ngx-odm/rxdb';
import { Todo, TODOS_COLLECTION_CONFIG, todosListAnimation } from '@shared';
import { TodoStore } from './todos.store';

@Component({
  standalone: true,
  selector: 'demo-todos',
  templateUrl: './todos.component.html',
  styleUrls: ['./todos.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [todosListAnimation],
  imports: [CommonModule],
  providers: [
    provideRxCollection(TODOS_COLLECTION_CONFIG), // Collection will be created via this injection
    TodoStore,
    RenderScheduler,
  ],
})
export class TodosComponent {
  private renderScheduler = inject(RenderScheduler);
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
      this.renderScheduler.schedule();
    });
  }
}
