import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Todo, todosListAnimation } from '@shared';
import { Observable, tap } from 'rxjs';
import { TodosService } from './todos.service';

@Component({
  selector: 'demo-todos',
  templateUrl: './todos.component.html',
  styleUrls: ['./todos.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [todosListAnimation],
})
export class TodosComponent {
  private title = inject(Title);
  readonly todosService = inject(TodosService);

  filter$ = this.todosService.filter$;
  todos$: Observable<Todo[]> = this.todosService.todos$.pipe(
    tap(docs => {
      const total = docs.length;
      const remaining = docs.filter(doc => !doc.completed).length;
      this.title.setTitle(`(${total - remaining}/${total}) Todos done`);
    })
  );
  count$ = this.todosService.count$;

  isDialogOpen = false;
  selectedTodo: Todo = undefined;

  trackByFn = (index: number, item: Todo) => {
    return item.last_modified;
  };

  showContextMenu(event: Event, todo: Todo) {
    event.preventDefault();
    this.selectedTodo = todo;
    this.isDialogOpen = true;
  }
}
