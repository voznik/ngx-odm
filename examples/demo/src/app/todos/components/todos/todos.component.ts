import { trigger, transition, query, style, stagger, animate } from '@angular/animations';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Todo, TodosFilter } from '../../models';
import { TodosService } from '../../services';

const listAnimation = trigger('listAnimation', [
  transition('* <=> *', [
    query(
      ':enter',
      [
        style({ opacity: 0 }),
        stagger('100ms', animate('250ms ease-out', style({ opacity: 1 }))),
      ],
      { optional: true }
    ),
    query(':leave', animate('250ms', style({ opacity: 0 })), { optional: true }),
  ]),
]);

@Component({
  selector: 'demo-todos',
  templateUrl: './todos.component.html',
  styleUrls: ['./todos.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [listAnimation],
})
export class TodosComponent implements OnInit {
  filter$ = this.todosService.filter$;
  todos$: Observable<Todo[]> = this.todosService.todos$.pipe(
    tap(() => {
      // INFO: for `multiinstance` (multiple tabs) case - need to force change detection
      if (this.todosService.dbOptions.multiInstance) {
        this.cdRef.detectChanges();
      }
    })
  );
  count$ = this.todosService.count$;
  newTodo = '';
  isEditing = '';

  trackByFn(index: number, item: Todo) {
    return item.id;
  }

  constructor(
    private todosService: TodosService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.todosService.restoreFilter();
  }

  showRemainig(remaining: number | null) {
    return remaining !== null;
  }

  shouldDisableClear(remaining: number | null, count: number | null) {
    if (remaining === null || count === null) {
      return true;
    }

    return remaining > 0 || count === 0;
  }

  get isAddTodoDisabled() {
    return this.newTodo.length < 4;
  }

  newTodoChange(newTodo: string) {
    this.newTodo = newTodo;
  }

  newTodoClear() {
    this.newTodo = '';
  }

  editTodo(todo: Todo, elm: HTMLInputElement) {
    this.isEditing = todo.id;
    setTimeout(() => {
      elm.focus();
    }, 0);
  }

  stopEditing(todo: Todo, editedTitle: string) {
    this.isEditing = '';
  }

  cancelEditingTodo(todo: Todo) {
    this.isEditing = '';
  }

  updateEditingTodo(todo: Todo, editedTitle: string) {
    editedTitle = editedTitle.trim();
    this.isEditing = '';

    this.todosService.edit(todo.id, editedTitle);
  }

  addTodo() {
    this.todosService.add(this.newTodo.trim());
    this.newTodo = '';
  }

  toggleTodo(todo: Todo) {
    this.todosService.toggle(todo.id, !todo.completed);
  }

  removeTodo(todo: Todo) {
    this.todosService.remove(todo.id);
  }

  removeCompletedTodos() {
    this.todosService.removeCompletedTodos();
  }

  filterTodos(filter: TodosFilter) {
    this.todosService.changeFilter(filter);
  }
}
