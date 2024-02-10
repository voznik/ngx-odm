import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Observable, tap } from 'rxjs';
import { Todo } from './todos.model';
import { TodosService } from './todos.service';

const listAnimation = trigger('listAnimation', [
  transition('* <=> *', [
    query(
      ':enter',
      [
        style({ opacity: 0 }),
        stagger('50ms', animate('60ms ease-in', style({ opacity: 1 }))),
      ],
      { optional: true }
    ),
    query(':leave', stagger('10ms', animate('50ms ease-out', style({ opacity: 0 }))), {
      optional: true,
    }),
  ]),
]);

@Component({
  selector: 'demo-todos',
  templateUrl: './todos.component.html',
  styleUrls: ['./todos.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [listAnimation],
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
    console.log('showContextMenu', todo);
  }
}
