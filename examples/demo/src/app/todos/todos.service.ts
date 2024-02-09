/* eslint-disable no-console */
import { Injectable, inject } from '@angular/core';
import { NgxRxdbCollection, NgxRxdbCollectionService } from '@ngx-odm/rxdb/collection';
import { DEFAULT_LOCAL_DOCUMENT_ID } from '@ngx-odm/rxdb/config';
import type { RxDatabaseCreator } from 'rxdb';
import { Observable, distinctUntilChanged, startWith } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { Todo, TodosFilter, TodosLocalState } from './todos.model';

@Injectable()
export class TodosService {
  private collectionService: NgxRxdbCollection<Todo> = inject<NgxRxdbCollection<Todo>>(
    NgxRxdbCollectionService
  );
  newTodo = '';
  current: Todo = undefined;

  filter$: Observable<TodosFilter> = this.collectionService
    .getLocal$<TodosLocalState>(DEFAULT_LOCAL_DOCUMENT_ID, 'filter')
    .pipe(startWith('ALL'), distinctUntilChanged()) as Observable<TodosFilter>;

  count$ = this.collectionService.count();

  todos$: Observable<Todo[]> = this.collectionService.docs(
    this.collectionService.queryParams$
  );

  get dbOptions(): Readonly<RxDatabaseCreator> {
    return this.collectionService.dbOptions;
  }

  get isAddTodoDisabled() {
    return this.newTodo.length < 4;
  }

  addTodo(): void {
    if (this.isAddTodoDisabled) {
      return;
    }
    const id = uuid();
    const payload: Todo = {
      id,
      title: this.newTodo.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      last_modified: undefined,
    };
    this.collectionService.insert(payload);
    this.newTodo = '';
  }

  setEditinigTodo(todo: Todo, event: Event, isEditing: boolean) {
    const elm = event.target as HTMLElement;
    if (isEditing) {
      elm.contentEditable = 'plaintext-only';
      elm.focus();
      this.current = todo;
    } else {
      elm.contentEditable = 'false';
      elm.innerText = todo.title;
      this.current = undefined;
    }
  }

  updateEditingTodo(todo: Todo, event: Event) {
    event.preventDefault();
    const elm = event.target as HTMLElement;
    const payload = {
      title: elm.innerText.trim(),
      last_modified: Date.now(),
    } as Todo;
    this.collectionService.set(todo.id, payload);
    this.setEditinigTodo(payload, event, false);
    this.current = undefined;
  }

  toggleTodo(todo: Todo): void {
    const payload = {
      completed: !todo.completed,
      last_modified: Date.now(),
    };
    this.collectionService.set(todo.id, payload);
  }

  toggleAllTodos(completed: boolean) {
    this.collectionService.updateBulk(
      { selector: { completed: { $eq: !completed } } },
      { completed }
    );
  }

  removeTodo(todo: Todo): void {
    this.collectionService.remove(todo.id);
  }

  removeCompletedTodos(): void {
    this.collectionService.removeBulk({ selector: { completed: true } });
    this.filterTodos('ALL');
  }

  filterTodos(filter: TodosFilter): void {
    const selector = filter === 'ALL' ? {} : { completed: { $eq: filter === 'COMPLETED' } };
    this.collectionService.patchQueryParams({ selector });
    this.collectionService.setLocal<TodosLocalState>(
      DEFAULT_LOCAL_DOCUMENT_ID,
      'filter',
      filter
    );
  }
}
