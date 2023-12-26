/* eslint-disable @typescript-eslint/no-unused-vars */
import { Location } from '@angular/common';
import { inject } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { withCallState, withDevtools } from '@angular-architects/ngrx-toolkit';
import { signalStore, withHooks } from '@ngrx/signals';
import { withEntities } from '@ngrx/signals/entities';
import { withCollectionService } from '@ngx-odm/rxdb/signals';
import { NgxRxdbUtils } from '@ngx-odm/rxdb/utils';
import { MangoQuery } from 'rxdb';
import { switchMap } from 'rxjs';
import { TodosCollectionConfig } from './todos.config';
import { Todo, TodosFilter } from './todos.model';

export const TodoStore = signalStore(
  { providedIn: 'root' },
  withDevtools('todo'),
  withEntities<Todo>(),
  // withCallState(),
  withCollectionService({
    filter: { value: 'ALL' as TodosFilter },
    collectionConfig: TodosCollectionConfig,
  }),
  withHooks({
    onInit: ({ filter, find, updateFilter }) => {
      const query: MangoQuery<Todo> = { selector: {}, sort: [{ createdAt: 'desc' }] };
      const location = inject(Location);
      const params = location.path().split('?')[1];
      const searchParams = new URLSearchParams(params);
      const filterValue = searchParams.get('filter') || filter().value;
      updateFilter({ value: filterValue as TodosFilter });
      find(query);
      // INFO: example on how to trigger a query on signal change. Disabled for now.
      toObservable(filter).pipe(
        switchMap(({ value }) => {
          if (value === 'COMPLETED') {
            query.selector = { completed: { $eq: true } };
          } else if (value === 'ACTIVE') {
            query.selector = { completed: { $eq: false } };
          }
          return find(query);
        }),
        takeUntilDestroyed(this)
      );
      // .subscribe();
    },
  })
);
