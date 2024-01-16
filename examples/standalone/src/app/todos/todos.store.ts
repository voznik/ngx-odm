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
import { v4 as uuid } from 'uuid';
import { TodosCollectionConfig } from './todos.config';
import { Todo, TodosFilter } from './todos.model';

export const TodoStore = signalStore(
  { providedIn: 'root' },
  withDevtools('todo'),
  withState({
    newTodo: '',
  }),
  withEntities<Todo>(),
  // INFO: an instance of RxCollection will be provided by this
  withCollectionService<Todo, TodosFilter, RxCollectionCreatorExtended>({
    filter: 'ALL' as TodosFilter,
    collectionConfig: TodosCollectionConfig,
  }),
  // INFO: Function calls in a template
  // Over the years, Angular developers have learned to avoid calling functions inside templates because a function re-runs every change detection and used pure pipes instead. This would cause expensive computations to run multiple times unnecessarily if the passed arguments did not change.
  // In a signal-based component, this idea no longer applies because the expressions will only re-evaluate as a result of a signal dependency change.
  // With signals, we no longer have to care about handling subscriptions. It is absolutely fine to call a signal function in the template since only the part that depends on that signal will be updated.
  withComputed(({ count, entities, entityMap, newTodo, filter }) => {
    return {
      isAddTodoDisabled: computed(() => newTodo().length < 4),
      filtered: computed(() => {
        return entities().filter(todo => {
          const filterValue = filter();
          if (filterValue === 'ALL') {
            return todo;
          }
          return todo.completed === (filterValue === 'COMPLETED');
        });
      }),
      remaining: computed(() => {
        return count() - entities().filter(todo => !todo.completed).length;
      }),
      title: computed(() => {
        const all = count(),
          remaining = entities().filter(todo => !todo.completed).length;
        return `(${all - remaining}/${all}) Todos done`;
      }),
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
        const current = store.current();
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
        store.updateFilter(filter);
      },
    };
  }),
  withHooks({
    /** On init update filter from URL and fetch documents from RxDb */
    onInit: ({ findAllDocs, filter, restoreFilter }) => {
      const query: MangoQuery<Todo> = { selector: {}, sort: [{ createdAt: 'desc' }] };
      restoreFilter();
      findAllDocs(query);
    },
  })
);
