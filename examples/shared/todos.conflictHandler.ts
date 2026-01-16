import type {
  RxConflictHandler,
  RxConflictHandlerInput,
  WithDeleted,
} from 'rxdb';
import { deepEqual } from 'rxdb';
import type { Todo } from './todos.model';

/**
 * The default conflict handler is a function that gets called when a conflict is detected.
 * In your custom conflict handler you likely want to merge properties of the realMasterState and the newDocumentState instead.
 * @param i
 * @see https://rxdb.info/replication.html#conflict-handling
 */
export const todosConflictHandler: RxConflictHandler<Todo> = {
  isEqual(
    a: WithDeleted<Todo>,
    b: WithDeleted<Todo>
    // context: string
  ) {
    return deepEqual(a, b);
  },
  resolve(
    i: RxConflictHandlerInput<Todo>
    // context: string
  ): Promise<WithDeleted<Todo>> {
    // always use the master state
    return Promise.resolve(i.realMasterState);
  },
};
