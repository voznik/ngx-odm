/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */ // FIXME: Remove this
import { Injector, Signal, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  getCallStateKeys,
  setError,
  setLoaded,
  setLoading,
} from '@angular-architects/ngrx-toolkit';
import { tapResponse } from '@ngrx/operators';
import {
  SignalStoreFeature,
  patchState,
  signalStoreFeature,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { setAllEntities } from '@ngrx/signals/entities';
import { NamedEntitySignals } from '@ngrx/signals/entities/src/models';
import { SignalStoreFeatureResult } from '@ngrx/signals/src/signal-store-models';
import { StateSignal } from '@ngrx/signals/src/state-signal';
import { NgxRxdbCollection, NgxRxdbCollectionService } from '@ngx-odm/rxdb/collection';
import {
  DEFAULT_LOCAL_DOCUMENT_ID,
  RXDB_CONFIG_COLLECTION,
  RxCollectionCreatorExtended,
} from '@ngx-odm/rxdb/config';
import { NgxRxdbUtils } from '@ngx-odm/rxdb/utils';
import { computedAsync } from 'ngxtension/computed-async';
import type { MangoQuery, MangoQuerySelector } from 'rxdb';
import { Subscribable, iif, map, of, switchMap, tap } from 'rxjs';

type EntityId = string;
type Entity = { id: EntityId };
export type Filter = string | Record<string, unknown>;
export type Query<T = Entity> = {
  /**
   * Selector is optional,
   * if not given, the query matches all documents
   * that are not _removed=true.
   */
  selector?: MangoQuerySelector<T>;
};
type FindQuery<E = Entity> = MangoQuery<E>;
type LocalDocument = {
  filter: Filter;
  query: string;
};

function capitalize(str: string): string {
  return str ? str[0].toUpperCase() + str.substring(1) : str;
}

export function getCollectionServiceKeys(options: { collection?: string }) {
  const filterKey = options.collection ? `${options.collection}Filter` : 'filter';
  const selectedIdsKey = options.collection
    ? `selected${capitalize(options.collection)}Ids`
    : 'selectedIds';
  const selectedEntitiesKey = options.collection
    ? `selected${capitalize(options.collection)}Entities`
    : 'selectedEntities';

  const restoreFilterKey = options.collection
    ? `restore${capitalize(options.collection)}Filter`
    : 'restoreFilter';
  const updateFilterKey = options.collection
    ? `update${capitalize(options.collection)}Filter`
    : 'updateFilter';
  const updateSelectedKey = options.collection
    ? `updateSelected${capitalize(options.collection)}Entities`
    : 'updateSelected';
  const findKey = options.collection
    ? `find${capitalize(options.collection)}Entities`
    : 'find';

  const currentKey = options.collection
    ? `current${capitalize(options.collection)}`
    : 'current';
  const setCurrentKey = options.collection
    ? `setCurrent${capitalize(options.collection)}`
    : 'setCurrent';
  const insertKey = options.collection
    ? `insert${capitalize(options.collection)}`
    : 'insert';
  const updateKey = options.collection
    ? `update${capitalize(options.collection)}`
    : 'update';
  const updateAllByKey = options.collection
    ? `updateAll${capitalize(options.collection)}By`
    : 'updateAllBy';
  const removeKey = options.collection
    ? `remove${capitalize(options.collection)}`
    : 'remove';
  const removeAllByKey = options.collection
    ? `removeAll${capitalize(options.collection)}By`
    : 'removeAllBy';

  // TODO: Take these from @ngrx/signals/entities, when they are exported
  const entitiesKey = options.collection ? `${options.collection}Entities` : 'entities';
  const entityMapKey = options.collection ? `${options.collection}EntityMap` : 'entityMap';
  const idsKey = options.collection ? `${options.collection}Ids` : 'ids';

  return {
    filterKey,
    selectedIdsKey,
    selectedEntitiesKey,
    restoreFilterKey,
    updateFilterKey,
    updateSelectedKey,
    findKey,
    entitiesKey,
    entityMapKey,
    idsKey,

    currentKey,
    setCurrentKey,
    insertKey,
    updateKey,
    updateAllByKey,
    removeKey,
    removeAllByKey,
  };
}

export type NamedCollectionServiceState<
  E extends Entity,
  F extends Filter,
  CName extends string,
> = {
  [K in CName as `${K}Filter`]: F;
} & {
  [K in CName as `selected${Capitalize<K>}Ids`]: Record<EntityId, boolean>;
} & {
  [K in CName as `current${Capitalize<K>}`]: E;
} & {
  [K in CName as `docs`]: E[];
};

export type CollectionServiceState<E extends Entity, F extends Filter> = {
  filter: F;
  selectedIds: Record<EntityId, boolean>;
  current: E;
  docs: E[];
};

export type NamedCollectionServiceSignals<E extends Entity, CName extends string> = {
  [K in CName as `selected${Capitalize<K>}Entities`]: Signal<E[]>;
} & {
  [K in CName as `count${Capitalize<K>}Entities`]: Signal<number>;
};

export type CollectionServiceSignals<E extends Entity> = {
  selectedEntities: Signal<E[]>;
  count: Signal<number>;
};

export type NamedCollectionServiceMethods<
  E extends Entity,
  F extends Filter,
  CName extends string,
> = {
  [K in CName as `restore${Capitalize<K>}Filter`]: () => void;
} & {
  [K in CName as `update${Capitalize<K>}Filter`]: (filter: F) => void;
} & {
  [K in CName as `updateSelected${Capitalize<K>}Entities`]: (
    id: EntityId,
    selected: boolean
  ) => void;
} & {
  [K in CName as `setCurrent${Capitalize<K>}`]: (entity: E) => void;
} & {
  ['findAllDocs']: (query?: Query<E>) => Subscribable<any>;
} & {
  [K in CName as `find${Capitalize<K>}ById`]: (id: EntityId) => Promise<void>;
} & {
  [K in CName as `insert${Capitalize<K>}`]: (entity: E) => Promise<void>;
} & {
  [K in CName as `update${Capitalize<K>}`]: (entity: E) => Promise<void>;
} & {
  [K in CName as `updateAll${Capitalize<K>}By`]: (
    query: Query<E>,
    data: Partial<E>
  ) => Promise<void>;
} & {
  [K in CName as `remove${Capitalize<K>}`]: (entity: E) => Promise<void>;
} & {
  [K in CName as `removeAll${Capitalize<K>}By`]: (query: Query<E>) => Promise<void>;
};

export type CollectionServiceMethods<E extends Entity, F extends Filter> = {
  restoreFilter: () => void;
  updateFilter: (filter: F) => void;
  updateSelected: (id: EntityId, selected: boolean) => void;
  setCurrent(entity: E): void;
  findAllDocs: (query?: Query<E>) => Subscribable<any>;
  insert(entity: E): Promise<void>;
  update(entity: E): Promise<void>;
  updateAllBy(query: Query<E>, data: Partial<E>): Promise<void>;
  remove(entity: E): Promise<void>;
  removeAllBy(query: Query<E>): Promise<void>;
};

export function withCollectionService<
  E extends Entity,
  F extends Filter,
  CName extends string,
>(options: {
  collection: CName;
  filter: F;
  query?: 'local' | FindQuery<E>;
}): SignalStoreFeature<
  {
    state: Record<string, never>;
    // These alternatives break type inference:
    // state: { callState: CallState } & NamedEntityState<E, Collection>,
    // state: NamedEntityState<E, Collection>,

    signals: NamedEntitySignals<E, CName>;
    methods: Record<string, never>;
  },
  {
    state: NamedCollectionServiceState<E, F, CName>;
    signals: NamedCollectionServiceSignals<E, CName>;
    methods: NamedCollectionServiceMethods<E, F, CName>;
  }
>;
export function withCollectionService<E extends Entity, F extends Filter>(options: {
  filter: F;
  query?: 'local' | FindQuery<E>;
}): SignalStoreFeature<
  SignalStoreFeatureResult,
  {
    state: CollectionServiceState<E, F>;
    signals: CollectionServiceSignals<E>;
    methods: CollectionServiceMethods<E, F>;
  }
>;
export function withCollectionService<
  E extends Entity,
  F extends Filter,
  CName extends string,
>(options: {
  collection?: CName;
  filter?: F;
  query?: 'local' | FindQuery<E>;
}): SignalStoreFeature<any, any> {
  let colService: NgxRxdbCollection<E>;
  let colConfig: RxCollectionCreatorExtended<E>;

  const { collection: prefix, filter } = options;
  const {
    entitiesKey,
    filterKey,
    selectedEntitiesKey,
    selectedIdsKey,
    restoreFilterKey,
    updateFilterKey,
    updateSelectedKey,

    currentKey,
    insertKey,
    updateKey,
    updateAllByKey,
    removeKey,
    removeAllByKey,
    setCurrentKey,
  } = getCollectionServiceKeys(options);

  const { callStateKey } = getCallStateKeys({ collection: prefix });

  const ensureWithEntities = (store: Record<string, unknown> & StateSignal<object>) => {
    if (!(entitiesKey in store)) {
      throw new Error(
        `'withCollectionService' can only be used together with 'withEntities' from "@ngrx/singals/entities" signal store feature.`
      );
    }
  };

  const ensureCollection = () => {
    if (colService) return;
    // const injector = assertInjector(signalStoreFeature, undefined);
    const injector = inject(Injector);
    colService = injector.get(NgxRxdbCollectionService) as NgxRxdbCollection<any>;
    colConfig = injector.get(RXDB_CONFIG_COLLECTION);
  };

  return signalStoreFeature(
    withState(() => {
      return {
        [filterKey]: filter,
        [selectedIdsKey]: {} as Record<EntityId, boolean>,
        [currentKey]: undefined as E | undefined,
      };
    }),
    withComputed((store: Record<string, unknown>) => {
      ensureWithEntities(store as any);
      ensureCollection();
      const entities = store[entitiesKey] as Signal<E[]>;
      const selectedIds = store[selectedIdsKey] as Signal<Record<EntityId, boolean>>;

      return {
        // TODO: decide if direct connection is needed
        ['docs']: computedAsync(
          () => {
            const query: Query<E> = { selector: {} };
            return colService.docs(query).pipe(
              tap(docs => {
                NgxRxdbUtils.logger.log('docs', docs);
              })
            );
          },
          { initialValue: [] }
        ),
        [selectedEntitiesKey]: computed(() => entities().filter(e => selectedIds()[e.id])),
        ['count']: computed(() => entities().length),
      };
    }),
    withMethods((store: Record<string, unknown> & StateSignal<object>) => {
      ensureWithEntities(store);
      ensureCollection();
      return {
        [restoreFilterKey]: async (): Promise<void> => {
          if (colConfig?.options?.persistLocalToURL) {
            // await colService.restoreLocalFromURL(DEFAULT_LOCAL_DOCUMENT_ID);
          }
          const local = await colService.getLocal(DEFAULT_LOCAL_DOCUMENT_ID);
          if (local) {
            patchState(store, { [filterKey]: local[filterKey] });
          }
        },
        [updateFilterKey]: async (filter: F): Promise<void> => {
          store[callStateKey] && patchState(store, setLoading(prefix));
          if (typeof filter === 'string') {
            await colService.setLocal<LocalDocument>(
              DEFAULT_LOCAL_DOCUMENT_ID,
              'filter',
              filter
            );
          } else {
            await colService.upsertLocal(DEFAULT_LOCAL_DOCUMENT_ID, filter);
          }
          patchState(store, { [filterKey]: filter });
          store[callStateKey] && patchState(store, setLoaded(prefix));
        },
        [updateSelectedKey]: (id: EntityId, selected: boolean): void => {
          patchState(store, (state: Record<string, unknown>) => ({
            [selectedIdsKey]: {
              ...(state[selectedIdsKey] as Record<EntityId, boolean>),
              [id]: selected,
            },
          }));
        },
        [setCurrentKey]: (current: E): void => {
          patchState(store, { [currentKey]: current });
        },
        [insertKey]: async (entity: E): Promise<void> => {
          store[callStateKey] && patchState(store, setLoading(prefix));

          try {
            await colService.insert(entity);
            // INFO: here we don't need to update entity store because
            // the store already updated by susbcription to the collection and its handler in  `findAllDocs`
            store[callStateKey] && patchState(store, setLoaded(prefix));
          } catch (e) {
            store[callStateKey] && patchState(store, setError(e, prefix));
            throw e;
          }
        },
        [updateKey]: async (entity: E): Promise<void> => {
          // patchState(store, { [currentKey]: entity }); // TODO: if we need to use `current`
          store[callStateKey] && patchState(store, setLoading(prefix));

          try {
            await colService.upsert(entity);
            // INFO: here we don't need to update entity store because
            // the store already updated by susbcription to the collection and its handler in  `findAllDocs`
            store[callStateKey] && patchState(store, setLoaded(prefix));
            // patchState(store, { [currentKey]: undefined }); // TODO: if we need to use `current`
          } catch (e) {
            store[callStateKey] && patchState(store, setError(e, prefix));
            throw e;
          }
        },
        [updateAllByKey]: async (query: Query<E>, data: Partial<E>): Promise<void> => {
          store[callStateKey] && patchState(store, setLoading(prefix));

          try {
            const result = await colService.updateBulk(query, data);
            // INFO: here we don't need to update entity store because
            // the store already updated by susbcription to the collection and its handler in  `findAllDocs`
            store[callStateKey] && patchState(store, setLoaded(prefix));
          } catch (e) {
            store[callStateKey] && patchState(store, setError(e, prefix));
            throw e;
          }
        },
        [removeKey]: async (entity: E): Promise<void> => {
          store[callStateKey] && patchState(store, setLoading(prefix));

          try {
            await colService.remove(entity);
            // INFO: here we don't need to update entity store because
            // the store already updated by susbcription to the collection and its handler in  `findAllDocs`
            store[callStateKey] && patchState(store, setLoaded(prefix));
          } catch (e) {
            store[callStateKey] && patchState(store, setError(e, prefix));
            throw e;
          }
        },
        [removeAllByKey]: async (query: Query<E>): Promise<void> => {
          store[callStateKey] && patchState(store, setLoading(prefix));

          try {
            const { success, error } = await colService.removeBulk(query);
            // INFO: here we don't need to update entity store because
            // the store already updated by susbcription to the collection and its handler in  `findAllDocs`
            store[callStateKey] && patchState(store, setLoaded(prefix));
          } catch (e) {
            store[callStateKey] && patchState(store, setError(e, prefix));
            throw e;
          }
        },
      };
    }),
    withHooks({
      /**
       * Populate signals/entities with values
       * @param store
       */
      onInit: async store => {
        iif(
          () => options?.query === 'local',
          colService.getLocal$<LocalDocument>(DEFAULT_LOCAL_DOCUMENT_ID).pipe(
            map((data: any) => {
              const { filter, selector, sort, limit, skip } = data;
              return { selector, sort, limit, skip } as any; // FindQuery<E>;
            })
          ),
          of(options?.query)
        )
          .pipe(
            switchMap((query: FindQuery<E> | undefined) => {
              store[callStateKey] && patchState(store, setLoading(prefix));
              return colService.docs(query).pipe(
                tapResponse({
                  next: result => {
                    store[callStateKey] && patchState(store, setLoaded(prefix));
                    return patchState(
                      store,
                      prefix
                        ? setAllEntities(result, { collection: prefix })
                        : setAllEntities(result)
                    );
                  },
                  error: e => {
                    NgxRxdbUtils.logger.log(e);
                    store[callStateKey] && patchState(store, setError(e, prefix));
                  },
                  finalize: () =>
                    store[callStateKey] && patchState(store, setLoaded(prefix)),
                })
              );
            })
            // takeUntilDestroyed()
          )
          .subscribe();
      },
      onDestroy: () => {
        colService.destroy();
      },
    })
  );
}
