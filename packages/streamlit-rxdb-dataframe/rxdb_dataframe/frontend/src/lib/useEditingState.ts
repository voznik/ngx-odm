import { RxDBCollectionService } from '@ngx-odm/rxdb/collection';
import { NgxRxdbUtils, type Entity } from '@ngx-odm/rxdb/utils';
import equal from 'fast-deep-equal';
import { useEffect, useRef, useState } from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { v4 as uuid } from 'uuid';
import { DataframeEditingState } from './RxDBDataframeArgs';

const { logger, isEmpty } = NgxRxdbUtils;

/**
 * Custom hook that manages the editing state of a Dataframe.
 * @param editingState - The editing state of the Dataframe.
 * @param collectionService - The service used to interact with the RxDB collection.
 * @returns A tuple containing the entities and a function to set the entities.
 */
export const useEditedState = (
  editingState: DataframeEditingState,
  collectionService: RxDBCollectionService
): [Entity[] | undefined, React.Dispatch<React.SetStateAction<Entity[] | undefined>>] => {
  const [entities, setEntities] = useState<Entity[]>();
  const editingStateRef = useRef(editingState);

  useEffect(() => {
    if (
      !entities ||
      isEmpty(editingState) ||
      equal(editingState, editingStateRef.current)
    ) {
      return;
    }
    editingStateRef.current = editingState;

    if (!isEmpty(editingState.added_rows)) {
      const docs = editingState.added_rows.map(item => ({
        ...item,
        id: uuid(),
        createdAt: new Date().toISOString(),
        last_modified: Date.now(),
      }));
      if (!docs.length) return;
      collectionService.upsertBulk(docs).catch(error => logger.log('upsertBulk', error));
    }

    if (!isEmpty(editingState.deleted_rows)) {
      const ids: string[] = [];
      editingState.deleted_rows.forEach(rowIndex => {
        const entity = entities.at(rowIndex);
        if (entity) {
          ids.push(entity.id);
        }
      });
      if (!ids.length) return;
      collectionService.removeBulk(ids).catch(error => logger.log('removeBulk', error));
    }

    if (!isEmpty(editingState.edited_rows)) {
      const docs = Object.entries(editingState.edited_rows).map(([rowIndex, change]) => {
        const entity = entities.at(parseInt(rowIndex));
        return {
          ...entity,
          ...change,
          last_modified: Date.now(),
        };
      });
      if (!docs.length) return;
      collectionService.upsertBulk(docs).catch(error => logger.log('upsertBulk', error));
    }
  }, [editingState, entities]);

  return [entities, setEntities];
};
