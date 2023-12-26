import { Pipe, PipeTransform } from '@angular/core';
import { NgxRxdbUtils } from '@ngx-odm/rxdb/utils';
import { Todo, TodosFilter } from './todos.model';

@Pipe({ standalone: true, name: 'byStatus', pure: true })
export class TodosPipe implements PipeTransform {
  transform(value: Todo[], status: TodosFilter): Todo[] {
    NgxRxdbUtils.logger.log('TodosPipe:transform', value, status);
    if (!value) {
      return value;
    }
    if (status === 'ALL') {
      return value;
    }
    return value.filter(todo => todo.completed === (status === 'COMPLETED'));
  }
}
