/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { RxDBCollectionService } from '@ngx-odm/rxdb/collection';
import {
  getRxDatabaseCreator,
  RxDatabaseCreatorExtended,
  type RxCollectionCreatorExtended,
} from '@ngx-odm/rxdb/config';
import { RxDBService } from '@ngx-odm/rxdb/core';
import { Entity, EntityId, NgxRxdbUtils } from '@ngx-odm/rxdb/utils';
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { Subscription } from 'rxjs';
import {
  ArrowTable,
  ComponentProps,
  RenderData,
  Streamlit,
  withStreamlitConnection,
} from 'streamlit-component-lib';
import equal from 'fast-deep-equal';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { v4 as uuid } from 'uuid';

const { logger, isEmpty, isEmptyObject } = NgxRxdbUtils;

type DataframeEditingState = {
  edited_rows: Record<EntityId, Entity>;
  added_rows: Entity[];
  deleted_rows: number[];
};

interface ComponentArgs {
  collection_config: RxCollectionCreatorExtended;
  db_config: RxDatabaseCreatorExtended;
  dataframe: ArrowTable;
  data: Entity[];
  editing_state: DataframeEditingState;
}

/**
 * Dataframe example using Apache Arrow.
 */
const RxDBDataframe: React.FC<ComponentProps> = props => {
  const [inited, setInited] = useState<boolean>();
  const [entities, setEntities] = useState<Entity[]>();
  let _editingState: DataframeEditingState = {} as any;
  const [renderData, setRenderData] = useState<RenderData<ComponentArgs>>();
  const dbServiceRef = useRef<RxDBService>();
  const collectionServiceRef = useRef<RxDBCollectionService>();
  const subs: Subscription[] = [];
  if (!dbServiceRef.current) {
    dbServiceRef.current = new RxDBService();
  }

  async function initDb(dbConfig: RxDatabaseCreatorExtended) {
    const parsedDbConfig = getRxDatabaseCreator(dbConfig);
    return dbServiceRef.current!.initDb(parsedDbConfig);
  }

  async function initCollection(collectionConfig: RxCollectionCreatorExtended) {
    if (!collectionServiceRef.current) {
      collectionServiceRef.current = new RxDBCollectionService(
        collectionConfig,
        dbServiceRef.current!
      );
    }
    await collectionServiceRef.current!.info();
    setInited(true);
    const sub = collectionServiceRef.current!.docs({ // eslint-disable-line
        selector: {},
        sort: [{ last_modified: 'asc' }],
      })
      .subscribe(docs => {
        if (!docs) {
          return;
        }
        logger.table(docs);
        setEntities(docs);
        Streamlit.setComponentValue(docs);
      });
    subs.push(sub);
  }

  useEffect(() => {
    const onRenderEvent = (event: Event): void => {
      const renderEvent = event as CustomEvent<RenderData>;
      setRenderData(renderEvent.detail);
    };

    // Set up event listeners, and signal to Streamlit that we're ready.
    // We won't render the component until we receive the first RENDER_EVENT.
    Streamlit.events.addEventListener(Streamlit.RENDER_EVENT, onRenderEvent);
    Streamlit.setComponentReady();

    const cleanup = () => {
      Streamlit.events.removeEventListener(Streamlit.RENDER_EVENT, onRenderEvent);
      subs.forEach(sub => sub.unsubscribe());
    };
    return cleanup;
  }, []);

  if (isEmptyObject(renderData)) return null; // Don't do anything at all

  const { dataframe, editing_state, collection_config, db_config } = renderData!.args;

  if (!inited) {
    try {
      initDb(db_config).then(() => initCollection(collection_config));
    } catch (error) {
      logger.log('Error initializing database', error);
    }
  }

  if (!isEmpty(editing_state) && !equal(_editingState, editing_state)) {
    _editingState = editing_state;
    if (!isEmpty(_editingState.added_rows)) {
      const docs = _editingState.added_rows.map(item => ({
        ...item,
        id: uuid(),
        createdAt: new Date().toISOString(),
        last_modified: Date.now(),
      }));
      collectionServiceRef.current!.upsertBulk(docs);
    }

    if (!isEmpty(_editingState.deleted_rows) && !isEmpty(entities)) {
      const ids: string[] = [];
      _editingState.deleted_rows.forEach(rowIndex => {
        const entity = entities!.at(rowIndex);
        if (entity) {
          ids.push(entity.id);
        }
      });
      collectionServiceRef.current!.removeBulk(ids);
    }

    if (!isEmpty(_editingState.edited_rows) && !isEmpty(entities)) {
      Object.entries(_editingState.edited_rows).forEach(([rowIndex, change]) => {
        const entity = entities!.at(parseInt(rowIndex));
        if (entity) {
          collectionServiceRef.current!.set(entity.id, change);
        }
      });
    }
  }

  return props.args.element as ReactNode;
};

export default withStreamlitConnection(RxDBDataframe);
