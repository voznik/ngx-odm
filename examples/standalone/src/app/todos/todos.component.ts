import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { CommonModule, Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { LetDirective, PushPipe } from '@ngrx/component';
import { v4 as uuid } from 'uuid';
import { Todo, TodosFilter } from './todos.model';
import { TodosPipe } from './todos.pipe';
import { TodoStore } from './todos.store';

const listAnimation = trigger('listAnimation', [
  transition('* <=> *', [
    query(
      ':enter',
      [
        style({ opacity: 0 }),
        stagger('100ms', animate('150ms ease-out', style({ opacity: 1 }))),
      ],
      { optional: true }
    ),
    query(':leave', animate('150ms', style({ opacity: 0 })), { optional: true }),
  ]),
]);

@Component({
  standalone: true,
  selector: 'demo-todos',
  templateUrl: './todos.component.html',
  styleUrls: ['./todos.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [listAnimation],
  imports: [
    CommonModule,
    FormsModule,
    LetDirective,
    PushPipe,
    TodosPipe,
    //
  ],
  providers: [TodoStore],
})
export class TodosComponent {
  private location = inject(Location);
  private title = inject(Title);
  readonly todoStore = inject(TodoStore);
  newTodo = '';
  isEditing = '';
  // todos: Todo[] = this.todoStore.entities();
  // filter: TodosFilter;
  // count = 0;
  // remaining: number;

  constructor() {
    // effect(() => {
    //   // this.todos = this.todoStore.entities();
    //   this.count = this.todos.length;
    //   this.filter = this.todoStore.filter().value;
    //   this.remaining = this.todos.filter(doc => !doc.completed).length;
    //   this.title.setTitle(`(${this.count - this.remaining}/${this.count}) Todos done`);
    //   NgxRxdbUtils.logger.log(
    //     'store:component:effect',
    //     this.todoStore,
    //     'filter',
    //     this.todoStore.filter()
    //   );
    // });
  }

  trackByFn(index: number, item: Todo) {
    return item.id;
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
    const payload: Todo = {
      ...todo,
      title: editedTitle,
      last_modified: Date.now(),
    };
    this.todoStore.update(payload);
  }

  addTodo() {
    const payload: Todo = {
      id: uuid(),
      title: this.newTodo.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      last_modified: Date.now(),
    };
    this.todoStore.create(payload);
    this.newTodo = '';
  }

  toggleTodo(todo: Todo) {
    const payload: Todo = {
      ...todo,
      completed: !todo.completed,
      last_modified: Date.now(),
    };
    this.todoStore.update(payload);
  }

  removeTodo(todo: Todo) {
    this.todoStore.delete(todo);
  }

  removeCompletedTodos() {
    this.todoStore.deleteAllBy({ selector: { completed: { $eq: true } } });
  }

  filterTodos(filterValue: TodosFilter): void {
    const path = this.location.path().split('?')[0];
    this.location.replaceState(path, `filter=${filterValue}`);
    this.todoStore.updateFilter({ value: filterValue });
  }
}
