/* eslint-disable no-console */
import { Location } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NgxRxdbCollection, NgxRxdbCollectionService } from '@ngx-odm/rxdb/collection';
import type { MangoQuery, RxDatabaseCreator } from 'rxdb';
import {
  Observable,
  of,
  defaultIfEmpty,
  distinctUntilChanged,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { v4 as uuid } from 'uuid';
import { Todo, TodosFilter } from '../models';

@Injectable()
export class TodosService {
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

  constructor(
    @Inject(NgxRxdbCollectionService) private collectionService: NgxRxdbCollection<Todo>,
    private location: Location,
    private title: Title
  ) {}

  add(title: string): void {
    const id = uuid();
    const payload: Todo = {
      id,
      // _id: id,
      title,
      completed: false,
      createdAt: new Date().toISOString(),
      last_modified: undefined,
    };
    this.collectionService.insert(payload);
  }

  edit(id: string, title: string): void {
    this.collectionService.set(id, { title });
  }

  toggle(id: string, completed: boolean): void {
    this.collectionService.set(id, { completed });
  }

  remove(id: string): void {
    this.collectionService.remove(id);
  }

  removeCompletedTodos(): void {
    const rulesObject = { selector: { completed: true } };
    this.collectionService.removeBulk(rulesObject);
    this.changeFilter('ALL');
  }

  restoreFilter(): void {
    const query = this.location.path().split('?')[1];
    const searchParams = new URLSearchParams(query);
    const filterValue = searchParams.get('filter') || 'ALL';
    this.collectionService.upsertLocal('local', { filterValue });
  }

  changeFilter(filterValue: TodosFilter): void {
    const path = this.location.path().split('?')[0];
    this.location.replaceState(path, `filter=${filterValue}`);
    this.collectionService.upsertLocal('local', { filterValue });
  }
}
