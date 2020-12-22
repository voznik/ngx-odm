import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
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
  remainig$: Observable<Todo[]> = this.todosService.select(true);
  newTodo = '';
  isEditing = false;

  constructor(private todosService: TodosService) {}

  ngOnInit() {
    this.todosService.restoreFilter();
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

  editTodo() {
    this.isEditing = true;
  }

  stopEditing(todo: Todo, editedTitle: string) {
    todo.title = editedTitle;
    this.isEditing = false;
  }

  cancelEditingTodo(todo: Todo) {
    this.isEditing = false;
  }

  updateEditingTodo(todo: Todo, editedTitle: string) {
    editedTitle = editedTitle.trim();
    this.isEditing = false;

    /* if (editedTitle.length === 0) {
      return this.todosService.remove(todo.id);
    } */

    todo.title = editedTitle;
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
