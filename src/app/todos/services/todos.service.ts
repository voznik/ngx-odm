import { Injectable } from '@angular/core';
import { LocalStorageService } from '@app/core/services';
import { noop } from 'micro-dash';
import { NgxRxdbCollectionService } from 'ngx-rxdb';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { Todo, TodosFilter } from '../models';

@Injectable()
export class TodosService {
  collectionName = 'todo';
  filter$ = new BehaviorSubject<TodosFilter>('ALL');
  constructor(private collectionService: NgxRxdbCollectionService<Todo>, private localStorage: LocalStorageService) {}

  selectTodos(): Observable<Todo[]> {
    return this.filter$.pipe(
      switchMap(filterValue => {
        const rulesObject: any = {
          $and: [{ dateCreated: { $gt: null } }],
        };
        filterValue === 'ALL'
          ? noop()
          : rulesObject.$and.push({ done: { $eq: filterValue === 'DONE' } });
        return this.collectionService.docs(rulesObject, '-dateCreated');
      })
    );
  }

  add(name: string): void {
    const payload: Todo = { guid: uuid(), name, done: false, dateCreated: Date.now() };
    // tslint:disable-next-line:no-string-literal
    this.collectionService.insert(payload).subscribe(doc => console.log(doc['idLength']()));
  }

  toggle(guid: string, done: boolean): void {
    this.collectionService.update(guid, { done }).subscribe(doc => console.log(doc));
  }

  removeDoneTodos(): void {
    const rulesObject = { done: { $eq: true } };
    // TODO: refresh todos after bulkDelete
    this.collectionService.removeBulkBy(rulesObject).subscribe(res => this.changeFilter('ALL'));
  }

  restoreFilter(): void {
    const filterValue: TodosFilter = this.localStorage.getItem('todosFilter') || 'ALL';
    this.changeFilter(filterValue);
  }

  changeFilter(filterValue: TodosFilter): void {
    this.localStorage.setItem('todosFilter', filterValue);
    this.filter$.next(filterValue);
  }
}
