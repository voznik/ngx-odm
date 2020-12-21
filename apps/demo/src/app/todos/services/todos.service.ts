import { Injectable } from '@angular/core';
import { NgxRxdbCollectionService } from '@ngx-odm/rxdb';
import { BehaviorSubject, Observable, iif } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { Todo, TodosFilter } from '../models';

@Injectable()
export class TodosService {
  private _filter$ = new BehaviorSubject<TodosFilter>('ALL');
  filter$ = this._filter$.asObservable();

  constructor(private collectionService: NgxRxdbCollectionService<Todo>) {}

  select(completedOnly = false): Observable<Todo[]> {
    const queryObj = {
      selector: {
        createdAt: {
          $gt: null,
        },
      },
      sort: [{ createdAt: 'desc' } as any],
    };
    if (completedOnly) {
      Object.assign(queryObj.selector, {
        completed: false,
      });
      return this.collectionService.docs(queryObj);
    } else {
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
  }

  add(title: string): void {
    const payload: Todo = {
      id: uuid(),
      title,
      completed: false,
      createdAt: Date.now(),
    };
    this.collectionService.insert(payload).subscribe();
  }

  toggle(id: string, completed: boolean): void {
    this.collectionService.update(id, { completed }).subscribe();
  }

  remove(id: string): void {
    this.collectionService.remove(id).subscribe();
  }

  removeCompletedTodos(): void {
    const rulesObject = { selector: { completed: true } };
    this.collectionService
      .removeBulkBy(rulesObject)
      .subscribe(res => this.changeFilter('ALL'));
  }

  restoreFilter(): void {
    const filterValue = localStorage.getItem('todosFilter') || 'ALL';
    this.changeFilter(filterValue as TodosFilter);
  }

  changeFilter(filterValue: TodosFilter): void {
    localStorage.setItem('todosFilter', filterValue);
    this._filter$.next(filterValue);
  }
}
