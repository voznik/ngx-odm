/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */ // FIXME: Remove this
import { Signal, computed } from '@angular/core';
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
  withMethods,
  withState,
} from '@ngrx/signals';
import { setAllEntities } from '@ngrx/signals/entities';
import { NamedEntitySignals } from '@ngrx/signals/entities/src/models';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { SignalStoreFeatureResult } from '@ngrx/signals/src/signal-store-models';
import { StateSignal } from '@ngrx/signals/src/state-signal';
import { DEFAULT_LOCAL_DOCUMENT_ID, NgxRxdbCollection } from '@ngx-odm/rxdb/collection';
import { RxCollectionCreatorExtended } from '@ngx-odm/rxdb/config';
import type { MangoQuerySelector } from 'rxdb';
import { firstValueFrom, pipe, switchMap } from 'rxjs';

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

function capitalize(str: string): string {
  return str ? str[0].toUpperCase() + str.substring(1) : str;
}

function getCollectionServiceKeys(options: { collection?: string }) {
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
  const findByIdKey = options.collection
    ? `find${capitalize(options.collection)}ById`
    : 'findById';
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
    findByIdKey,
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
};

export type CollectionServiceState<E extends Entity, F extends Filter> = {
  filter: F;
  selectedIds: Record<EntityId, boolean>;
  current: E;
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
  ['findAllDocs']: (query?: Query<E>) => void;
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
  findAllDocs: (query?: Query<E>) => void;
  findById(id: EntityId): Promise<void>;
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
  Config extends RxCollectionCreatorExtended,
>(options: {
  filter: F;
  collection: CName;
  collectionConfig: Config;
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
export function withCollectionService<
  E extends Entity,
  F extends Filter,
  Config extends RxCollectionCreatorExtended,
>(options: {
  filter: F;
  collectionConfig: Config;
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
  Config extends RxCollectionCreatorExtended,
>(options: {
  collection?: CName;
  filter?: F;
  collectionConfig: Config;
}): SignalStoreFeature<any, any> {
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
    findByIdKey,
    setCurrentKey,
  } = getCollectionServiceKeys(options);

  const { callStateKey } = getCallStateKeys({ collection: prefix });

  return signalStoreFeature(
    withState(() => ({
      [filterKey]: filter,
      [selectedIdsKey]: {} as Record<EntityId, boolean>,
      [currentKey]: undefined as E | undefined,
    })),
    withComputed((store: Record<string, unknown>) => {
      const entities = store[entitiesKey] as Signal<E[]>;
      const selectedIds = store[selectedIdsKey] as Signal<Record<EntityId, boolean>>;

      return {
        [selectedEntitiesKey]: computed(() => entities().filter(e => selectedIds()[e.id])),
        ['count']: computed(() => entities().length),
      };
    }),
    withMethods((store: Record<string, unknown> & StateSignal<object>) => {
      const collection = new NgxRxdbCollection<Entity>(options.collectionConfig);

      return {
        [restoreFilterKey]: async (): Promise<void> => {
          if (options.collectionConfig.options?.persistLocalToURL) {
            await collection.restoreLocalFromURL(DEFAULT_LOCAL_DOCUMENT_ID);
          }
          const local = await collection.getLocal(DEFAULT_LOCAL_DOCUMENT_ID);
          patchState(store, { [filterKey]: local[filterKey] });
        },
        [updateFilterKey]: async (filter: F): Promise<void> => {
          if (typeof filter === 'string') {
            await collection.setLocal(DEFAULT_LOCAL_DOCUMENT_ID, 'filter', filter);
          } else {
            await collection.upsertLocal(DEFAULT_LOCAL_DOCUMENT_ID, filter);
          }
          patchState(store, { [filterKey]: filter });
        },
        [updateSelectedKey]: (id: EntityId, selected: boolean): void => {
          patchState(store, (state: Record<string, unknown>) => ({
            [selectedIdsKey]: {
              ...(state[selectedIdsKey] as Record<EntityId, boolean>),
              [id]: selected,
            },
          }));
        },
        findAllDocs: rxMethod(
          pipe(
            switchMap(query =>
              collection.docs({}).pipe(
                tapResponse({
                  next: result => {
                    store[callStateKey] && patchState(store, setLoading(prefix));
                    return patchState(
                      store,
                      prefix
                        ? setAllEntities(result, { collection: prefix })
                        : setAllEntities(result)
                    );
                  },
                  error: console.error,
                  finalize: () =>
                    store[callStateKey] && patchState(store, setLoaded(prefix)),
                })
              )
            )
          )
        ),
        [findByIdKey]: async (id: EntityId): Promise<void> => {
          store[callStateKey] && patchState(store, setLoading(prefix));

          try {
            const current = await firstValueFrom(collection.get(id));
            store[callStateKey] && patchState(store, setLoaded(prefix));
            patchState(store, { [currentKey]: current });
          } catch (e) {
            store[callStateKey] && patchState(store, setError(e, prefix));
            throw e;
          }
        },
        [setCurrentKey]: (current: E): void => {
          patchState(store, { [currentKey]: current });
        },
        [insertKey]: async (entity: E): Promise<void> => {
          // patchState(store, { [currentKey]: entity });
          store[callStateKey] && patchState(store, setLoading(prefix));

          try {
            const insertd = (await collection.insert(entity)).toJSON();
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
            const updated = (await collection.upsert(entity))?.toJSON();
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
            const result = await collection.updateBulk(query, data);
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
            await collection.remove(entity);
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
            const { success, error } = await collection.removeBulk(query);
            // INFO: here we don't need to update entity store because
            // the store already updated by susbcription to the collection and its handler in  `findAllDocs`
            store[callStateKey] && patchState(store, setLoaded(prefix));
          } catch (e) {
            store[callStateKey] && patchState(store, setError(e, prefix));
            throw e;
          }
        },
      };
    })
  );
}
