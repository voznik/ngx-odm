import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { CommonModule, Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { v4 as uuid } from 'uuid';
import { Todo, TodosFilter } from './todos.model';
import { TodoStore } from './todos.store';

const listAnimation = trigger('listAnimation', [
  transition('* <=> *', [
    query(
      ':enter',
      [
        style({ opacity: 0 }),
        stagger('50ms', animate('100ms ease-out', style({ opacity: 1 }))),
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
  imports: [CommonModule, FormsModule],
  providers: [TodoStore],
})
export class TodosComponent {
  private cdRef = inject(ChangeDetectorRef);
  private location = inject(Location);
  private title = inject(Title);
  readonly todoStore = inject(TodoStore);

  trackByFn = (index: number, item: Todo) => item.id;

  constructor() {
    effect(() => {
      const { count, remaining } = this.todoStore;
      this.title.setTitle(`(${count() - remaining()}/${count()}) Todos done`);
      console.log('!!! ~ file: todos.component.ts:68 ~ constructor ~ effect');
      this.cdRef.detectChanges();
    });
  }

  editTodo(todo: Todo, elm: HTMLElement) {
    this.todoStore.setCurrent(todo);
    elm.contentEditable = 'plaintext-only';
    elm.focus();
  }

  stopEditing({ title }: Todo, elm: HTMLElement) {
    if (elm.contentEditable !== 'false') {
      elm.contentEditable = 'false';
      elm.innerText = title;
    }
    this.todoStore.setCurrent(undefined);
  }

  updateEditingTodo(todo: Todo, elm: HTMLElement) {
    const payload: Todo = {
      ...todo,
      title: elm.innerText.trim(),
      last_modified: Date.now(),
    };
    this.todoStore.update(payload);
    this.stopEditing(payload, elm);
  }

  addTodo(event: Event) {
    event.preventDefault();
    if (this.todoStore.isAddTodoDisabled()) {
      return;
    }
    const payload: Todo = {
      id: uuid(),
      title: this.todoStore.newTodo().trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      last_modified: Date.now(),
    };
    this.resetInput(event.target as HTMLInputElement);
    this.todoStore.create(payload);
  }

  resetInput(newtodoInput: HTMLInputElement) {
    newtodoInput.value = '';
    this.todoStore.newTodoChange('');
  }

  toggleTodo(todo: Todo) {
    const payload: Todo = {
      ...todo,
      completed: !todo.completed,
      last_modified: Date.now(),
    };
    this.todoStore.update(payload);
  }

  toggleAllTodos(completed: boolean) {
    this.todoStore.updateAllBy(
      { selector: { completed: { $eq: !completed } } },
      { completed }
    );
  }

  removeTodo(todo: Todo) {
    this.todoStore.delete(todo);
  }

  removeCompletedTodos() {
    this.todoStore.deleteAllBy({ selector: { completed: { $eq: true } } });
  }

  filterTodos(filter: TodosFilter): void {
    const path = this.location.path().split('?')[0];
    this.location.replaceState(path, `filter=${filter}`);
    this.todoStore.updateFilter(filter);
    this.cdRef.detectChanges();
  }
}
