/* eslint-disable no-console */
import { Location } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { NgxRxdbCollection, NgxRxdbCollectionService } from '@ngx-odm/rxdb/collection';
import { MangoQuery } from 'rxdb/dist/types/types';
import { Observable } from 'rxjs';
import { distinctUntilChanged, startWith, switchMap, map, tap } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { Todo, TodosFilter } from '../models';

@Injectable()
export class TodosService {
  filter$ = this.collectionService.getLocal('local', 'filterValue').pipe(
    startWith('ALL'),
    distinctUntilChanged(),
    tap(filterValue => console.log('filterValue', filterValue))
  );

  count$ = this.collectionService.count();

  remaining$: Observable<number> = this.collectionService.docs().pipe(
    map(docs => docs.filter(doc => !doc.completed).length),
    tap(remaining => console.log('remaining', remaining))
  );

  constructor(
    @Inject(NgxRxdbCollectionService) private collectionService: NgxRxdbCollection<Todo>,
    private location: Location
  ) {
    this.collectionService.initialized$
      .pipe(switchMap(() => this.getCount()))
      .subscribe(count => {
        console.debug('count', count);
      });
  }

  async getCount() {
    const count = await this.collectionService.collection?.['countAllDocuments']?.();
    return count;
  }

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
