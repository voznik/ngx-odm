/* eslint-disable @typescript-eslint/no-unused-vars */
import { computed } from '@angular/core';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { withEntities } from '@ngrx/signals/entities';
import { RxCollectionCreatorExtended } from '@ngx-odm/rxdb/config';
import { withCollectionService } from '@ngx-odm/rxdb/signals';
import { MangoQuery } from 'rxdb';
import { TodosCollectionConfig } from './todos.config';
import { Todo } from './todos.model';

export const TodoStore = signalStore(
  { providedIn: 'root' },
  withDevtools('todo'),
  withState({
    newTodo: '',
  }),
  withEntities<Todo>(),
  withCollectionService<Todo, string, RxCollectionCreatorExtended>({
    filter: 'ALL' as string,
    collectionConfig: TodosCollectionConfig,
  }),
  // INFO: Function calls in a template
  // Over the years, Angular developers have learned to avoid calling functions inside templates because a function re-runs every change detection and used pure pipes instead. This would cause expensive computations to run multiple times unnecessarily if the passed arguments did not change.
  // In a signal-based component, this idea no longer applies because the expressions will only re-evaluate as a result of a signal dependency change.
  // With signals, we no longer have to care about handling subscriptions. It is absolutely fine to call a signal function in the template since only the part that depends on that signal will be updated.
  withComputed(({ entities, newTodo, filter }) => ({
    isAddTodoDisabled: computed(() => newTodo().length < 4),
    filtered: computed(() =>
      entities().filter(todo => {
        if (filter() === 'ALL') {
          return todo;
        }
        return todo.completed === (filter() === 'COMPLETED');
      })
    ),
    remaining: computed(() => entities().filter(todo => !todo.completed).length),
  })),
  withMethods(store => ({
    newTodoChange(newTodo: string) {
      patchState(store, { newTodo });
    },
  })),
  withHooks({
    /** On init update filter from URL and fetch documents from RxDb */
    onInit: ({ filter, find, updateFilter }) => {
      const query: MangoQuery<Todo> = { selector: {}, sort: [{ createdAt: 'desc' }] };
      const params = location.search.split('?')[1];
      const searchParams = new URLSearchParams(params);
      updateFilter(searchParams.get('filter') || filter());
      find(query);
      // INFO: example on how to trigger a query on signal change. Disabled for now.
      /* toObservable(filter)
        .pipe(
          switchMap(filterValue => {
            if (filterValue === 'COMPLETED') {
              query.selector = { completed: { $eq: true } };
            } else if (filterValue === 'ACTIVE') {
              query.selector = { completed: { $eq: false } };
            }
            return find(query);
          }),
          takeUntilDestroyed(this)
        )
        .subscribe(); */
    },
  })
);
