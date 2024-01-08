import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Todo } from '../../models';
import { TodosService } from '../../services';

const listAnimation = trigger('listAnimation', [
  transition('* <=> *', [
    query(
      ':enter',
      [
        style({ opacity: 0 }),
        stagger('50ms', animate('60ms ease-in', style({ opacity: 1 }))),
      ],
      { optional: true }
    ),
    query(':leave', stagger('10ms', animate('50ms ease-out', style({ opacity: 0 }))), {
      optional: true,
    }),
  ]),
]);

@Component({
  selector: 'demo-todos',
  templateUrl: './todos.component.html',
  styleUrls: ['./todos.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [listAnimation],
})
export class TodosComponent implements OnInit {
  private cdRef = inject(ChangeDetectorRef);
  readonly todosService = inject(TodosService);
  filter$ = this.todosService.filter$;
  todos$: Observable<Todo[]> = this.todosService.todos$.pipe(
    tap(() => {
      // INFO: for `multiinstance` (multiple tabs) case - need to force change detection
      if (this.todosService.dbOptions.multiInstance) {
        this.cdRef.detectChanges();
      }
    })
  );
  count$ = this.todosService.count$;
  trackByFn = (index: number, item: Todo) => item.id;

  ngOnInit() {
    this.todosService.restoreFilter();
  }
}
