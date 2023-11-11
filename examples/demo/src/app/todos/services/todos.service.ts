/* eslint-disable no-console */
import { Location } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NgxRxdbCollection, NgxRxdbCollectionService } from '@ngx-odm/rxdb/collection';
import { MangoQuery } from 'rxdb/dist/types/types';
import { Observable } from 'rxjs';
import { distinctUntilChanged, startWith, switchMap, tap } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { Todo, TodosFilter } from '../models';

@Injectable()
export class TodosService {
  filter$: Observable<TodosFilter> = this.collectionService
    .getLocal('local', 'filterValue')
    .pipe(startWith('ALL'), distinctUntilChanged()) as Observable<TodosFilter>;

  count$ = this.collectionService.count();

  todos$: Observable<Todo[]> = this.collectionService.docs().pipe(
    tap(docs => {
      const total = docs.length;
      const remaining = docs.filter(doc => !doc.completed).length;
      this.title.setTitle(`(${total - remaining}/${total}) Todos done`);
    })
  );

  constructor(
    @Inject(NgxRxdbCollectionService) private collectionService: NgxRxdbCollection<Todo>,
    private location: Location,
    private title: Title
  ) {}

  select(completedOnly = false): Observable<Todo[]> {
    const queryObj = this.buildQueryObject(completedOnly);
    return this.filter$.pipe(
      switchMap(filterValue => {
        if (filterValue !== 'ALL') {
          Object.assign(queryObj.selector, {
            completed: filterValue === 'COMPLETED',
          });
        } else {
          delete queryObj.selector['completed'];
        }
        return this.collectionService.docs(queryObj);
      })
    );
  }

  add(title: string): void {
    const id = uuid();
    const payload: Todo = {
      id,
      // _id: id,
      title,
      completed: false,
      createdAt: Date.now(),
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

  private buildQueryObject(completedOnly: boolean): MangoQuery<Todo> {
    const queryObj: MangoQuery<Todo> = {
      selector: {},
      sort: [{ createdAt: 'desc' }],
    };
    if (completedOnly) {
      Object.assign(queryObj.selector, {
        completed: false,
      });
    }
    return queryObj;
  }
}
