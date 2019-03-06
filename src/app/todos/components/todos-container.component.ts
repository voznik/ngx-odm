import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ROUTE_ANIMATIONS_ELEMENTS } from '@app/core/services';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { Todo, TodosFilter } from '../models';
import { TodosService } from '../services';



@Component({
  selector: 'app-todos',
  templateUrl: './todos-container.component.html',
  styleUrls: ['./todos-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TodosContainerComponent implements OnInit {
  routeAnimationsElements = ROUTE_ANIMATIONS_ELEMENTS;
  todos$: Observable<Todo[]>;
  removeDoneDisabled$: Observable<boolean>;
  newTodo = '';

  constructor(
    private todosService: TodosService,
    public snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.todosService.restoreFilter();
    this.todos$ = this.todosService.selectTodos();
  }

  get isAddTodoDisabled() {
    return this.newTodo.length < 4;
  }

  onNewTodoChange(newTodo: string) {
    this.newTodo = newTodo;
  }

  onNewTodoClear() {
    this.newTodo = '';
  }

  onAddTodo() {
    this.todosService.add(this.newTodo);
    // const addedMessage = `${name} added`;
    // this.notificationService.info(addedMessage);
    this.newTodo = '';
  }

  onToggleTodo(todo: Todo) {
    this.todosService.toggle(todo.guid, !todo.done);
    const newStatus = `anms.examples.todos.filter.${todo.done ? 'active' : 'done'}`;
    const undo = `anms.examples.todos.undo`;
    const toggledMessage = `anms.examples.todos.toggle.notification`;

    this.snackBar
      .open(`${toggledMessage} ${newStatus}`, undo, {
        duration: 2500,
        panelClass: 'todos-notification-overlay'
      })
      .onAction()
      .pipe(take(1))
      .subscribe(() => this.onToggleTodo({ ...todo, done: !todo.done }));
  }

  onRemoveDoneTodos() {
    this.todosService.removeDoneTodos();
    const removedMessage = `anms.examples.todos.remove.notification`;
  }

  onFilterTodos(filter: TodosFilter) {
    this.todosService.changeFilter(filter);
    const filterToMessage = `anms.examples.todos.filter.notification`;
    const filterMessage = `anms.examples.todos.filter.${filter.toLowerCase()}`;
    // this.notificationService.info(`${filterToMessage} ${filterMessage}`);
  }
}
