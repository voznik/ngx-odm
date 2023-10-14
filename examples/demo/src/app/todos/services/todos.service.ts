/* eslint-disable no-console */
import { Inject, Injectable } from '@angular/core';
import { NgxRxdbCollection, NgxRxdbCollectionService } from '@ngx-odm/rxdb/collection';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { Todo, TodosFilter } from '../models';
import { MangoQuery } from 'rxdb/dist/types/types';

@Injectable()
export class TodosService {
  private _filter$ = new Subject<TodosFilter>();
  filter$ = this._filter$.asObservable();

  constructor(
    @Inject(NgxRxdbCollectionService) private collectionService: NgxRxdbCollection<Todo>
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
    const payload: Todo = {
      id: uuid(),
      title,
      completed: false,
      createdAt: Date.now(),
    };
    this.collectionService.insert(payload);
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

  private buildQueryObject(completedOnly: boolean): MangoQuery<Todo> {
    const queryObj: MangoQuery<Todo> = {
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
    }
    return queryObj;
  }
}
