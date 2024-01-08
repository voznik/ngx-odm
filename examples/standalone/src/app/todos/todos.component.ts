import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  inject,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NgxRxdbUtils } from '@ngx-odm/rxdb/utils';
import { Todo } from './todos.model';
import { TodoStore } from './todos.store';

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
  standalone: true,
  selector: 'demo-todos',
  templateUrl: './todos.component.html',
  styleUrls: ['./todos.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [listAnimation],
  imports: [CommonModule],
  providers: [TodoStore],
})
export class TodosComponent {
  private cdRef = inject(ChangeDetectorRef);
  private titleService = inject(Title);
  readonly todoStore = inject(TodoStore);
  manualCD = true; // INFO: Angular 17 doesn't provide way to detect changes with `signals` ONLY and no zone

  trackByFn = (index: number, item: Todo) => {
    return item.last_modified;
  };

  constructor() {
    effect(() => {
      const { title, filter, entities } = this.todoStore;
      const titleString = title();
      this.titleService.setTitle(titleString);
      NgxRxdbUtils.logger.log(filter()); // INFO: signals on their own do not work if we do not use it directly here to trigger CD
      NgxRxdbUtils.logger.table(entities()); // INFO: signals on their own do not work if we do not use it directly here to trigger CD
      if (this.manualCD) {
        this.cdRef.detectChanges();
      }
    });
  }
}
