import type {
  RxConflictHandler,
  RxConflictHandlerInput,
  RxConflictHandlerOutput,
} from 'rxdb';
import { deepEqual } from 'rxdb';
import { Todo } from './todos.model';

/**
 * The default conflict handler is a function that gets called when a conflict is detected.
 * In your custom conflict handler you likely want to merge properties of the realMasterState and the newDocumentState instead.
 * @param i
 * @see https://rxdb.info/replication.html#conflict-handling
 */
export const todosConflictHandler: RxConflictHandler<Todo> = function (
  i: RxConflictHandlerInput<Todo>
): Promise<RxConflictHandlerOutput<Todo>> {
  if (deepEqual(i.newDocumentState, i.realMasterState)) {
    return Promise.resolve({
      isEqual: true,
    });
  }
  return Promise.resolve({
    isEqual: false,
    documentData: i.realMasterState,
  });
};
