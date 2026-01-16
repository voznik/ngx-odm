import { RxDBCollectionService } from '@ngx-odm/rxdb/collection';
import {
  RxDatabaseCreatorExtended,
  getRxDatabaseCreator,
  type RxCollectionCreatorExtended,
} from '@ngx-odm/rxdb/config';
import { RxDBService } from '@ngx-odm/rxdb/core';
import { NgxRxdbUtils } from '@ngx-odm/rxdb/utils';
import equal from 'fast-deep-equal';
import React, { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { MangoQuery } from 'rxdb';
import { BehaviorSubject, Subscription, distinctUntilChanged, withLatestFrom } from 'rxjs';
import {
  ComponentProps,
  Streamlit,
  withStreamlitConnection,
} from 'streamlit-component-lib';
import { RxDBDataframeArgs } from './RxDBDataframeArgs';
import { useEditedState } from './useEditingState';
import { useNullableRenderData } from './useNullableRenderData';

const { logger, isEmptyObject, tapOnce } = NgxRxdbUtils;

/**
 * Dataframe example using Apache Arrow.
 * @param props
 */
const RxDBDataframe: React.FC<ComponentProps> = props => {
  const [inited, setInited] = useState<boolean>();
  const querySubjectRef = useRef<BehaviorSubject<MangoQuery>>();
  const subRef = useRef<Subscription>();
  if (!subRef.current) {
    subRef.current = new Subscription();
  }
  if (!querySubjectRef.current) {
    querySubjectRef.current = new BehaviorSubject<MangoQuery>({});
  }
  const renderData = useNullableRenderData(subRef.current);
  // Parse the render data
  const { editing_state, collection_config, db_config, query, with_rev } =
    renderData?.['args'] || ({} as RxDBDataframeArgs);

  const dbServiceRef = useRef<RxDBService>();
  const collectionServiceRef = useRef<RxDBCollectionService>();
  if (!dbServiceRef.current) {
    dbServiceRef.current = new RxDBService();
  }
  const collectionService = () => collectionServiceRef.current!;

  const [, setEntities] = useEditedState(editing_state, collectionService());

  const initDb = useCallback((dbConfig: RxDatabaseCreatorExtended) => {
    const parsedDbConfig = getRxDatabaseCreator(dbConfig);
    return dbServiceRef.current!.initDb(parsedDbConfig);
  }, []);

  const initCollection = useCallback(
    async (collectionConfig: RxCollectionCreatorExtended) => {
      if (!collectionServiceRef.current) {
        collectionServiceRef.current = new RxDBCollectionService(
          collectionConfig,
          dbServiceRef.current!
        );
      }
      const query$ = querySubjectRef.current!.pipe(distinctUntilChanged(equal));
      const docssub = collectionService()
        .docs(query$, with_rev)
        .pipe(
          //
          tapOnce(() => setInited(true)),
          withLatestFrom(collectionService().info())
        )
        .subscribe(([docs, info]) => {
          if (!docs) {
            return;
          }
          setEntities(docs);
          Streamlit.setComponentValue({
            docs,
            info,
            query: querySubjectRef.current!.value,
          });
          Streamlit.setFrameHeight();
        });
      subRef.current!.add(docssub);
      logger.log('Collection & docs subscription initialized, with', query, with_rev);
    },
    []
  );

  useEffect(() => {
    if (!inited) {
      return;
    }
    if (query) {
      querySubjectRef.current!.next(query);
    }
  }, [inited, query]);

  if (isEmptyObject(renderData)) {
    return null;
  } // Don't do anything at all

  if (!inited) {
    initDb(db_config)
      .then(() => initCollection(collection_config))
      .catch(logger.log);
  }

  return props.args.element as ReactNode;
};

export const RxDBDataframeComponent = withStreamlitConnection(RxDBDataframe);
