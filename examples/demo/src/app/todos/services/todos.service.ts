/* eslint-disable no-console */
import { Location } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NgxRxdbCollectionService, NgxRxdbCollection } from '@ngx-odm/rxdb/collection';
import type { RxDatabaseCreator } from 'rxdb';
import {
  Observable,
  defaultIfEmpty,
  distinctUntilChanged,
  of,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { v4 as uuid } from 'uuid';
import { Todo, TodosFilter } from '../models';

@Injectable()
export class TodosService {
  private collectionService: NgxRxdbCollection<Todo> = inject<NgxRxdbCollection<Todo>>(
    NgxRxdbCollectionService
  );
  private location = inject(Location);
  private title = inject(Title);
  newTodo = '';
  isEditing = '';

  filter$: Observable<TodosFilter> = this.collectionService
    .getLocal('local', 'filterValue')
    .pipe(
      startWith('ALL'),
      distinctUntilChanged(),
      defaultIfEmpty('ALL')
    ) as Observable<TodosFilter>;

  count$ = this.collectionService.count().pipe(defaultIfEmpty(0));

  todos$: Observable<Todo[]> = of([]).pipe(
    switchMap(() => this.collectionService.docs()),
    tap(docs => {
      const total = docs.length;
      const remaining = docs.filter(doc => !doc.completed).length;
      this.title.setTitle(`(${total - remaining}/${total}) Todos done`);
    }),
    defaultIfEmpty([])
  );

  get dbOptions(): Readonly<RxDatabaseCreator> {
    return this.collectionService.dbOptions;
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

  stopEditing() {
    this.isEditing = '';
  }

  add(): void {
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

  updateEditingTodo(todo: Todo, title: string): void {
    this.collectionService.set(todo.id, { title });
  }

  toggle(todo: Todo): void {
    this.collectionService.set(todo.id, { completed: !todo.completed });
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

  restoreFilter(): void {
    const query = this.location.path().split('?')[1];
    const searchParams = new URLSearchParams(query);
    const filterValue = searchParams.get('filter') || 'ALL';
    this.collectionService.upsertLocal('local', { filterValue });
  }

  filterTodos(filterValue: TodosFilter): void {
    const path = this.location.path().split('?')[0];
    this.location.replaceState(path, `filter=${filterValue}`);
    this.collectionService.upsertLocal('local', { filterValue });
  }
}
