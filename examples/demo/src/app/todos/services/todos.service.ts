/* eslint-disable no-console */
import { Injectable } from '@angular/core';
import { NgxRxdbCollectionService } from '@ngx-odm/rxdb';
import { Observable, ReplaySubject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { Todo, TodosFilter } from '../models';

@Injectable()
export class TodosService {
  private _filter$ = new ReplaySubject<TodosFilter>();
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
    this.collectionService.set(id, { completed }).subscribe();
  }

  remove(id: string): void {
    this.collectionService.remove(id).subscribe();
  }

  removeCompletedTodos(): void {
    const rulesObject = { selector: { completed: true } };
    this.collectionService
      .removeBulk(rulesObject)
      .subscribe(res => this.changeFilter('ALL'));
  }

  restoreFilter(): void {
    this.collectionService.getLocal('local').subscribe((local: any) => {
      const filterValue = local?.get('filterValue');
      this.changeFilter(filterValue || 'ALL');
    });
  }

  changeFilter(filterValue: TodosFilter): void {
    this.collectionService.upsertLocal('local', { filterValue }).subscribe(local => {
      this._filter$.next(filterValue);
    });
  }
}
