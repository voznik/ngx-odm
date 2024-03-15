/* eslint-disable @typescript-eslint/no-explicit-any */
import { RxDBCollectionService } from '@ngx-odm/rxdb/collection';
import {
  RxDatabaseCreatorExtended,
  getRxDatabaseCreator,
  type RxCollectionCreatorExtended,
} from '@ngx-odm/rxdb/config';
import { RxDBService } from '@ngx-odm/rxdb/core';
import { NgxRxdbUtils } from '@ngx-odm/rxdb/utils';
import React, { ReactNode, useCallback, useRef, useState } from 'react';
import {
  ComponentProps,
  Streamlit,
  withStreamlitConnection,
} from 'streamlit-component-lib';
import { RxDBDataframeArgs } from './RxDBDataframeArgs';
import { useEditedState } from './useEditingState';
import { useNullableRenderData } from './useNullableRenderData';

const { logger, isEmptyObject } = NgxRxdbUtils;

/**
 * Dataframe example using Apache Arrow.
 */
const RxDBDataframe: React.FC<ComponentProps> = props => {
  const [inited, setInited] = useState<boolean>();
  const [renderData, sub] = useNullableRenderData();
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
      await collectionService().info();
      setInited(true);
      const docssub = collectionService()
        .docs(query, with_rev)
        .subscribe(docs => {
          if (!docs) {
            return;
          }
          logger.table(docs);
          setEntities(docs);
          Streamlit.setComponentValue(docs);
        });
      sub.add(docssub);
    },
    []
  );

  if (isEmptyObject(renderData)) return null; // Don't do anything at all

  if (!inited) {
    initDb(db_config)
      .then(() => initCollection(collection_config))
      .catch(logger.log);
  }

  return props.args.element as ReactNode;
};

export default withStreamlitConnection(RxDBDataframe);
