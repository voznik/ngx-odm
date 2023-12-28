/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */ // FIXME: Remove this
import { Signal, computed, inject } from '@angular/core';
import {
  getCallStateKeys,
  setError,
  setLoaded,
  setLoading,
} from '@angular-architects/ngrx-toolkit';
import {
  SignalStoreFeature,
  patchState,
  signalStoreFeature,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  addEntity,
  removeEntities,
  removeEntity,
  setAllEntities,
  updateEntities,
  updateEntity,
} from '@ngrx/signals/entities';
import { EntityChanges, NamedEntitySignals } from '@ngrx/signals/entities/src/models';
import { SignalStoreFeatureResult } from '@ngrx/signals/src/signal-store-models';
import { StateSignal } from '@ngrx/signals/src/state-signal';
import { NgxRxdbCollection } from '@ngx-odm/rxdb/collection';
import { RxCollectionCreatorExtended } from '@ngx-odm/rxdb/config';
import { NgxRxdbService } from '@ngx-odm/rxdb/core';
import { NgxRxdbUtils } from '@ngx-odm/rxdb/utils';
import type { MangoQuerySelector } from 'rxdb';
import { firstValueFrom } from 'rxjs';

type EntityId = string;
type Entity = { id: EntityId };
export type Filter = string | Record<string, unknown>;
export type Query<T = Entity> = {
  /**
   * Selector is optional,
   * if not given, the query matches all documents
   * that are not _deleted=true.
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
  const createKey = options.collection
    ? `create${capitalize(options.collection)}`
    : 'create';
  const updateKey = options.collection
    ? `update${capitalize(options.collection)}`
    : 'update';
  const updateAllByKey = options.collection
    ? `updateAll${capitalize(options.collection)}By`
    : 'updateAllBy';
  const deleteKey = options.collection
    ? `delete${capitalize(options.collection)}`
    : 'delete';
  const deleteAllByKey = options.collection
    ? `deleteAll${capitalize(options.collection)}By`
    : 'deleteAllBy';

  // TODO: Take these from @ngrx/signals/entities, when they are exported
  const entitiesKey = options.collection ? `${options.collection}Entities` : 'entities';
  const entityMapKey = options.collection ? `${options.collection}EntityMap` : 'entityMap';
  const idsKey = options.collection ? `${options.collection}Ids` : 'ids';

  return {
    filterKey,
    selectedIdsKey,
    selectedEntitiesKey,
    updateFilterKey,
    updateSelectedKey,
    findKey,
    entitiesKey,
    entityMapKey,
    idsKey,

    currentKey,
    findByIdKey,
    setCurrentKey,
    createKey,
    updateKey,
    updateAllByKey,
    deleteKey,
    deleteAllByKey,
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
  [K in CName as `update${Capitalize<K>}Filter`]: (filter: F) => void;
} & {
  [K in CName as `updateSelected${Capitalize<K>}Entities`]: (
    id: EntityId,
    selected: boolean
  ) => void;
} & {
  [K in CName as `find${Capitalize<K>}Entities`]: (query?: Query<E>) => Promise<void>;
} & {
  [K in CName as `setCurrent${Capitalize<K>}`]: (entity: E) => void;
} & {
  [K in CName as `find${Capitalize<K>}ById`]: (id: EntityId) => Promise<void>;
} & {
  [K in CName as `create${Capitalize<K>}`]: (entity: E) => Promise<void>;
} & {
  [K in CName as `update${Capitalize<K>}`]: (entity: E) => Promise<void>;
} & {
  [K in CName as `updateAll${Capitalize<K>}By`]: (
    query: Query<E>,
    data: Partial<E>
  ) => Promise<void>;
} & {
  [K in CName as `delete${Capitalize<K>}`]: (entity: E) => Promise<void>;
} & {
  [K in CName as `deleteAll${Capitalize<K>}By`]: (query: Query<E>) => Promise<void>;
};

export type CollectionServiceMethods<E extends Entity, F extends Filter> = {
  updateFilter: (filter: F) => void;
  updateSelected: (id: EntityId, selected: boolean) => void;
  find: (query?: Query<E>) => Promise<void>;

  setCurrent(entity: E): void;
  findById(id: EntityId): Promise<void>;
  create(entity: E): Promise<void>;
  update(entity: E): Promise<void>;
  updateAllBy(query: Query<E>, data: Partial<E>): Promise<void>;
  delete(entity: E): Promise<void>;
  deleteAllBy(query: Query<E>): Promise<void>;
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
    findKey,
    selectedEntitiesKey,
    selectedIdsKey,
    updateFilterKey,
    updateSelectedKey,

    currentKey,
    createKey,
    updateKey,
    updateAllByKey,
    deleteKey,
    deleteAllByKey,
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
      const collection = new NgxRxdbCollection(
        inject(NgxRxdbService),
        options.collectionConfig
      );

      return {
        [updateFilterKey]: (filter: F): void => {
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
        [findKey]: async (query?: Query<E>): Promise<void> => {
          store[callStateKey] && patchState(store, setLoading(prefix));

          try {
            const result = await firstValueFrom(collection.docs(query));
            NgxRxdbUtils.logger.log('store:find:result', result);
            patchState(
              store,
              prefix
                ? setAllEntities(result, { collection: prefix })
                : setAllEntities(result)
            );
            store[callStateKey] && patchState(store, setLoaded(prefix));
          } catch (e) {
            store[callStateKey] && patchState(store, setError(e, prefix));
            throw e;
          }
        },
        [findByIdKey]: async (id: EntityId): Promise<void> => {
          store[callStateKey] && patchState(store, setLoading(prefix));

          try {
            const current = await firstValueFrom(collection.findById(id));
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
        [createKey]: async (entity: E): Promise<void> => {
          // patchState(store, { [currentKey]: entity });
          store[callStateKey] && patchState(store, setLoading(prefix));

          try {
            const created = (await collection.create(entity)).toJSON();
            // patchState(store, { [currentKey]: created });
            patchState(
              store,
              prefix ? addEntity(created, { collection: prefix }) : addEntity(created)
            );
            store[callStateKey] && patchState(store, setLoaded(prefix));
          } catch (e) {
            store[callStateKey] && patchState(store, setError(e, prefix));
            throw e;
          }
        },
        [updateKey]: async (entity: E): Promise<void> => {
          store[callStateKey] && patchState(store, setLoading(prefix));

          try {
            const updated = (await collection.upsert(entity))?.toJSON();
            const updateArg = {
              id: updated!.id,
              changes: updated as EntityChanges<E>,
            };
            patchState(
              store,
              prefix
                ? updateEntity(updateArg, { collection: prefix })
                : updateEntity(updateArg)
            );
            store[callStateKey] && patchState(store, setLoaded(prefix));
            NgxRxdbUtils.logger.log('store:find:updated', entity, updated);
          } catch (e) {
            store[callStateKey] && patchState(store, setError(e, prefix));
            throw e;
          }
        },
        [updateAllByKey]: async (query: Query<E>, data: Partial<E>): Promise<void> => {
          store[callStateKey] && patchState(store, setLoading(prefix));

          try {
            const result = await collection.updateBulk(query, data);
            const ids = result.map((e: any) => e.id);
            patchState(store, { [currentKey]: undefined });
            patchState(
              store,
              prefix
                ? updateEntities({ ids, changes: data }, { collection: prefix })
                : updateEntities({ ids, changes: data })
            );
            store[callStateKey] && patchState(store, setLoaded(prefix));
          } catch (e) {
            store[callStateKey] && patchState(store, setError(e, prefix));
            throw e;
          }
        },
        [deleteKey]: async (entity: E): Promise<void> => {
          patchState(store, { [currentKey]: entity });
          store[callStateKey] && patchState(store, setLoading(prefix));

          try {
            await collection.delete(entity);
            patchState(store, { [currentKey]: undefined });
            patchState(
              store,
              prefix
                ? removeEntity(entity.id, { collection: prefix })
                : removeEntity(entity.id)
            );
            store[callStateKey] && patchState(store, setLoaded(prefix));
          } catch (e) {
            store[callStateKey] && patchState(store, setError(e, prefix));
            throw e;
          }
        },
        [deleteAllByKey]: async (query: Query<E>): Promise<void> => {
          store[callStateKey] && patchState(store, setLoading(prefix));

          try {
            const { success } = await collection.removeBulk(query);
            const ids = success.map((e: any) => e.id);
            patchState(store, { [currentKey]: undefined });
            patchState(
              store,
              prefix ? removeEntities(ids, { collection: prefix }) : removeEntities(ids)
            );
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
