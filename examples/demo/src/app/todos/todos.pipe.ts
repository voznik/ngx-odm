import { Pipe, PipeTransform, inject } from '@angular/core';
import { RXDB_CONFIG_COLLECTION } from '@ngx-odm/rxdb/config';
import { Todo, TodosFilter } from './todos.model';

@Pipe({ name: 'byStatus' })
export class TodosPipe implements PipeTransform {
  colConfig = inject(RXDB_CONFIG_COLLECTION);
  transform(value: Todo[], status: TodosFilter, force = false): Todo[] {
    if (!value || (this.colConfig.options.useQueryParams && !force)) {
      return value;
    }
    if (status === 'ALL') {
      return value;
    }
    return value.filter(todo => todo.completed === (status === 'COMPLETED'));
  }
}
