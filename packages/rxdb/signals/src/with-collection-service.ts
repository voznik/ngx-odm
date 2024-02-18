import { Injector, Signal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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
import { DEFAULT_LOCAL_DOCUMENT_ID } from '@ngx-odm/rxdb/config';
import { Entity, EntityId, NgxRxdbUtils } from '@ngx-odm/rxdb/utils';
// import { computedAsync } from 'ngxtension/computed-async';
// import { computedFrom } from 'ngxtension/computed-from';
// import { rxMethod } from '@ngrx/signals/rxjs-interop';
import type { MangoQuery, MangoQuerySelector } from 'rxdb';

const { isEmpty, logger, tapOnce } = NgxRxdbUtils;

export type Filter = string | Record<string, unknown>;
export type QuerySelect<T = Entity> = {
  selector?: MangoQuerySelector<T>;
};
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
  const setQueryParamsKey = 'setQueryParams';
  const updateQueryParamsKey = 'updateQueryParams';

  return {
    filterKey,
    setQueryParamsKey,
    updateQueryParamsKey,
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
  [`query`]: MangoQuery<E>;
} & {
  [K in CName as `selected${Capitalize<K>}Ids`]: Record<EntityId, boolean>;
} & {
  [K in CName as `current${Capitalize<K>}`]: E;
} & {
  [K in CName as `docs`]: E[];
};

export type CollectionServiceState<E extends Entity, F extends Filter> = {
  filter: F;
  query: MangoQuery<E>;
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
  [`sync`]: () => void;
} & {
  [K in CName as `update${Capitalize<K>}Filter`]: (filter: F) => void;
} & {
  [K in CName as `setQueryParams`]: (filter: F) => void;
} & {
  [K in CName as `updateQueryParams`]: (filter: F) => void;
} & {
  [K in CName as `updateSelected${Capitalize<K>}Entities`]: (
    id: EntityId,
    selected: boolean
  ) => void;
} & {
  [K in CName as `setCurrent${Capitalize<K>}`]: (entity: E) => void;
} & {
  [K in CName as `find${Capitalize<K>}ById`]: (id: EntityId) => Promise<void>;
} & {
  [K in CName as `insert${Capitalize<K>}`]: (entity: E) => Promise<void>;
} & {
  [K in CName as `update${Capitalize<K>}`]: (entity: E) => Promise<void>;
} & {
  [K in CName as `updateAll${Capitalize<K>}By`]: (
    query: QuerySelect<E>,
    data: Partial<E>
  ) => Promise<void>;
} & {
  [K in CName as `remove${Capitalize<K>}`]: (entity: E) => Promise<void>;
} & {
  [K in CName as `removeAll${Capitalize<K>}By`]: (query: QuerySelect<E>) => Promise<void>;
};

export type CollectionServiceMethods<E extends Entity, F extends Filter> = {
  sync: () => Promise<void>;
  updateFilter: (filter: F) => void;
  setQueryParams(query: MangoQuery<E>): void;
  updateQueryParams(query: MangoQuery<E>): void;
  updateSelected: (id: EntityId, selected: boolean) => void;
  setCurrent(entity: E): void;
  insert(entity: E): Promise<void>;
  update(entity: E): Promise<void>;
  updateAllBy(query: QuerySelect<E>, data: Partial<E>): Promise<void>;
  remove(entity: E): Promise<void>;
  removeAllBy(query: QuerySelect<E>): Promise<void>;
};

export function withCollectionService<
  E extends Entity,
  F extends Filter,
  CName extends string,
>(options: {
  collection: CName;
  filter: F;
  query?: MangoQuery<E>;
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
  query?: MangoQuery<E>;
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
  query?: MangoQuery<E>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): SignalStoreFeature<any, any> {
  let colService: NgxRxdbCollection<E>;

  const { collection: prefix, filter, query } = options;
  const {
    entitiesKey,
    filterKey,
    selectedEntitiesKey,
    selectedIdsKey,
    setQueryParamsKey,
    updateQueryParamsKey,
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

  const ensureWithEntities = (store: Record<string, unknown>) => {
    if (!(entitiesKey in store)) {
      throw new Error(
        `'withCollectionService' can only be used together with 'withEntities' from "@ngrx/singals/entities" signal store feature.`
      );
    }
  };

  const ensureCollection = () => {
    if (colService instanceof NgxRxdbCollection) return;
    const injector = inject(Injector);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    colService = injector.get(NgxRxdbCollectionService) as NgxRxdbCollection<any>;
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
      ensureWithEntities(store);
      ensureCollection();
      const entities = store[entitiesKey] as Signal<E[]>;
      const selectedIds = store[selectedIdsKey] as Signal<Record<EntityId, boolean>>;

      return {
        [selectedEntitiesKey]: computed(() => entities().filter(e => selectedIds()[e.id])),
        ['count']: computed(() => entities().length),
        ['query']: toSignal(colService.queryParams$), // computedFrom([colService.queryParams$])
      };
    }),
    withMethods((store: Record<string, unknown> & StateSignal<object>) => {
      ensureWithEntities(store);
      ensureCollection();
      return {
        ['sync']: async (): Promise<void> => {
          store[callStateKey] && patchState(store, setLoading(prefix));
          await colService.sync();
          store[callStateKey] && patchState(store, setLoaded(prefix));
        },
        [setQueryParamsKey]: async (q: MangoQuery<E>): Promise<void> => {
          store[callStateKey] && patchState(store, setLoading(prefix));
          colService.setQueryParams(q);
          store[callStateKey] && patchState(store, setLoaded(prefix));
        },
        [updateQueryParamsKey]: async (q: MangoQuery<E>): Promise<void> => {
          store[callStateKey] && patchState(store, setLoading(prefix));
          colService.patchQueryParams(q);
          store[callStateKey] && patchState(store, setLoaded(prefix));
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
        [updateAllByKey]: async (
          query: QuerySelect<E>,
          data: Partial<E>
        ): Promise<void> => {
          store[callStateKey] && patchState(store, setLoading(prefix));

          try {
            await colService.updateBulk(query, data);
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
        [removeAllByKey]: async (query: QuerySelect<E>): Promise<void> => {
          store[callStateKey] && patchState(store, setLoading(prefix));

          try {
            await colService.removeBulk(query);
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
       * Subscribe to RxDB documents to set signals/entities store
       * @param store
       */
      onInit: async store => {
        logger.log('withCollectionService:onInit:docs:query', query);
        store[callStateKey] && patchState(store, setLoading(prefix));
        colService
          .docs(colService.queryParams$)
          .pipe(
            tapOnce(() => {
              if (!isEmpty(query)) {
                colService.setQueryParams(query!);
              }
            }),
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
                logger.log(e);
                store[callStateKey] && patchState(store, setError(e, prefix));
              },
              finalize: () => store[callStateKey] && patchState(store, setLoaded(prefix)),
            })
          )
          .subscribe();
      },
      onDestroy: () => {
        colService.destroy();
      },
    })
  );
}
