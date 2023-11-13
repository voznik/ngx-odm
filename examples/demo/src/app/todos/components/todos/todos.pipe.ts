import { Pipe, PipeTransform } from '@angular/core';
import { Todo, TodosFilter, TodosState } from '../../models';

@Pipe({ name: 'byStatus', pure: false })
export class TodosPipe implements PipeTransform {
  transform(value: Todo[], status: TodosFilter): Todo[] {
    if (!value) {
      return value;
    }
    if (status === 'ALL') {
      return value;
    }
    return value.filter(todo => todo.completed === (status === 'COMPLETED'));
  }
}
