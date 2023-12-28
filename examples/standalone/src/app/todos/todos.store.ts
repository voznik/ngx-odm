/* eslint-disable @typescript-eslint/no-unused-vars */
import { Location } from '@angular/common';
import { ChangeDetectorRef, computed, inject } from '@angular/core';
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
  withCollectionService<Todo, string, RxCollectionCreatorExtended>({
    filter: 'ALL' as string,
    collectionConfig: TodosCollectionConfig,
  }),
  // INFO: Function calls in a template
  // Over the years, Angular developers have learned to avoid calling functions inside templates because a function re-runs every change detection and used pure pipes instead. This would cause expensive computations to run multiple times unnecessarily if the passed arguments did not change.
  // In a signal-based component, this idea no longer applies because the expressions will only re-evaluate as a result of a signal dependency change.
  // With signals, we no longer have to care about handling subscriptions. It is absolutely fine to call a signal function in the template since only the part that depends on that signal will be updated.
  withComputed(({ count, entities, newTodo, filter }) => {
    return {
      isAddTodoDisabled: computed(() => newTodo().length < 4),
      remaining: computed(() => entities().filter(todo => !todo.completed).length),
      filtered: computed(() =>
        entities().filter(todo => {
          const filterValue = filter();
          if (filterValue === 'ALL') {
            return todo;
          }
          return todo.completed === (filterValue === 'COMPLETED');
        })
      ),
      title: computed(() => {
        const all = count(),
          remaining = entities().filter(todo => !todo.completed).length;
        return `(${all - remaining}/${all}) Todos done`;
      }),
    };
  }),
  withMethods(store => {
    const location = inject(Location);
    const cdRef = inject(ChangeDetectorRef);
    return {
      newTodoChange(newTodo: string) {
        patchState(store, { newTodo });
      },
      addTodo(event: Event) {
        event.preventDefault();
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
        (event.target as HTMLInputElement).value = '';
        patchState(store, { newTodo: '' });
        store.create(payload);
      },
      editTodo(todo: Todo, elm: HTMLElement) {
        store.setCurrent(todo);
        elm.contentEditable = 'plaintext-only';
        elm.focus();
      },
      stopEditing({ title }: Todo, elm: HTMLElement) {
        if (elm.contentEditable !== 'false') {
          elm.contentEditable = 'false';
          elm.innerText = title;
        }
        store.setCurrent(undefined);
      },
      updateEditingTodo(todo: Todo, elm: HTMLElement) {
        const payload: Todo = {
          ...todo,
          title: elm.innerText.trim(),
          last_modified: Date.now(),
        };
        store.update(payload);
        this.stopEditing(payload, elm);
      },
      resetInput(newtodoInput: HTMLInputElement) {
        newtodoInput.value = '';
        patchState(store, { newTodo: '' });
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
        store.delete(todo);
      },
      removeCompletedTodos() {
        store.deleteAllBy({ selector: { completed: { $eq: true } } });
      },
      filterTodos(filter: TodosFilter): void {
        const path = location.path().split('?')[0];
        location.replaceState(path, `filter=${filter}`);
        store.updateFilter(filter);
        cdRef.detectChanges();
      },
    };
  }),
  withHooks({
    /** On init update filter from URL and fetch documents from RxDb */
    onInit: ({ filter, find, updateFilter }) => {
      const query: MangoQuery<Todo> = { selector: {}, sort: [{ createdAt: 'desc' }] };
      const params = location.search.split('?')[1];
      const searchParams = new URLSearchParams(params);
      updateFilter(searchParams.get('filter') || filter());
      find(query);
    },
  })
);
