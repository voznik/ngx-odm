import type {
  RxCollectionCreatorExtended,
  RxDatabaseCreatorExtended,
} from '@ngx-odm/rxdb/config';
import type { Entity, EntityId } from '@ngx-odm/rxdb/utils';
import { MangoQuery } from 'rxdb';
import { ArrowTable } from 'streamlit-component-lib';

export type DataframeEditingState = {
  edited_rows: Record<EntityId, Entity>;
  added_rows: Entity[];
  deleted_rows: number[];
};

export interface RxDBDataframeArgs {
  collection_config: RxCollectionCreatorExtended;
  query?: MangoQuery;
  with_rev?: boolean;
  db_config: RxDatabaseCreatorExtended;
  dataframe: ArrowTable;
  data: Entity[];
  editing_state: DataframeEditingState;
}
