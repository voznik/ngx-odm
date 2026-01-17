import { computed } from '@angular/core';
import { withCallState, withDevtools } from '@angular-architects/ngrx-toolkit';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { withEntities } from '@ngrx/signals/entities';
import { withCollectionService } from '@ngx-odm/rxdb/signals';
import { NgxRxdbUtils } from '@ngx-odm/rxdb/utils';
import { Todo, TodosFilter } from '@shared';
import { derivedFrom } from 'ngxtension/derived-from';
import { firstPropertyValueOfObject } from 'rxdb/plugins/utils';
import { map, pipe } from 'rxjs';
import { v4 as uuid } from 'uuid';

const { isEmpty, isValidNumber } = NgxRxdbUtils;

export const TodoStore = signalStore(
  { providedIn: 'root' },
  withDevtools('todo'),
  withState({
    newTodo: '',
  }),
  withEntities<Todo>(),
  withCallState(),
  // INFO: an instance of RxCollection will be provided by this
  withCollectionService<Todo, TodosFilter>({
    filter: 'ALL' as TodosFilter,
    query: {},
    countQuery: { selector: { completed: { $eq: false } } }, // count all remaining todos
  }),
  // INFO: Function calls in a template
  // Over the years, Angular developers have learned to avoid calling functions inside templates because a function re-runs every change detection and used pure pipes instead. This would cause expensive computations to run multiple times unnecessarily if the passed arguments did not change.
  // In a signal-based component, this idea no longer applies because the expressions will only re-evaluate as a result of a signal dependency change.
  // With signals, we no longer have to care about handling subscriptions. It is absolutely fine to call a signal function in the template since only the part that depends on that signal will be updated.
  withComputed(store => {
    const { countAll, countFiltered, entities, query, newTodo, filter } = store;
    const isAddTodoDisabled = computed(() => newTodo().length < 4);

    const filtered = computed(() => {
      const all = entities();
      const queryValue = query();
      if (!isEmpty(queryValue)) {
        return all;
      }
      const filterValue = filter();
      if (filterValue === 'ALL') {
        return all;
      }
      return all.filter(todo => {
        return todo.completed === (filterValue === 'COMPLETED');
      });
    });

    const remaining = computed(() => countFiltered());

    const title = derivedFrom(
      [countAll, remaining],
      pipe(
        map(([all, rem]) => {
          if (!isValidNumber(all) || !isValidNumber(rem)) {
            return '';
          }
          return `(${all - rem}/${all}) Todos done`;
        })
      )
    );

    const sortDir = computed(() => {
      const curQuery = query();
      if (isEmpty(curQuery?.sort)) {
        return undefined;
      }
      return firstPropertyValueOfObject(curQuery?.sort?.[0]);
    });

    return {
      isAddTodoDisabled,
      filtered,
      remaining,
      title,
      sortDir,
    };
  }),
  withMethods(store => {
    return {
      newTodoChange(newTodo: string) {
        patchState(store, { newTodo });
      },
      addTodo(event: Event) {
        event.preventDefault();
        const elm = event.target as HTMLInputElement;
        if (store.isAddTodoDisabled()) {
          return;
        }
        const payload: Todo = {
          id: uuid(),
          title: store.newTodo().trim(),
          completed: false,
          createdAt: new Date().toISOString(),
          last_modified: Date.now(),
        };
        elm.value = '';
        patchState(store, { newTodo: '' });
        store.insert(payload);
      },
      setEditinigTodo(todo: Todo, event: Event, isEditing: boolean) {
        const elm = event.target as HTMLElement;
        if (isEditing) {
          elm.contentEditable = 'plaintext-only';
          elm.focus();
          store.setCurrent(todo);
        } else {
          elm.contentEditable = 'false';
          elm.innerText = todo.title;
          store.setCurrent(undefined);
        }
      },
      updateEditingTodo(todo: Todo, event: Event) {
        event.preventDefault();
        const elm = event.target as HTMLElement;
        const payload: Todo = {
          ...todo,
          title: elm.innerText.trim(),
          last_modified: Date.now(),
        };
        store.update(payload);
        this.setEditinigTodo(payload, event, false);
      },
      toggleTodo(todo: Todo) {
        const payload: Todo = {
          ...todo,
          completed: !todo.completed,
          last_modified: Date.now(),
        };
        store.update(payload);
      },
      toggleAllTodos(completed: boolean) {
        store.updateAllBy({ selector: { completed: { $eq: !completed } } }, { completed });
      },
      removeTodo(todo: Todo) {
        store.remove(todo);
      },
      removeCompletedTodos() {
        store.removeAllBy({ selector: { completed: { $eq: true } } });
      },
      filterTodos(filter: TodosFilter): void {
        const selector =
          filter === 'ALL' ? {} : { completed: { $eq: filter === 'COMPLETED' } };
        store.updateQueryParams({ selector });
        store.updateFilter(filter);
      },
      sortTodos(dir: 'asc' | 'desc'): void {
        store.updateQueryParams({ sort: [{ last_modified: dir }] });
      },
    };
  }),
  withHooks({
    onInit: store => {
      store.sync(); // INFO: sync with remote example call
    },
  })
);
