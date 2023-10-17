import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
} from '@angular/core';
import { Observable } from 'rxjs';
import { Todo, TodosFilter } from '../../models';
import { TodosService } from '../../services';

@Component({
  selector: 'demo-todos',
  templateUrl: './todos.component.html',
  styleUrls: ['./todos.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodosComponent implements OnInit {
  filter$ = this.todosService.filter$;
  todos$: Observable<Todo[]> = this.todosService.select();
  count$ = this.todosService.count$;
  remainig$: Observable<number> = this.todosService.remaining$;
  newTodo = '';
  isEditing = '';

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
