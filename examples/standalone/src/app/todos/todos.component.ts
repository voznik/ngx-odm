import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RenderScheduler } from '@ngrx/component';
import { provideRxCollection } from '@ngx-odm/rxdb';
import { TodosCollectionConfig } from './todos.config';
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
  providers: [RenderScheduler, TodoStore, provideRxCollection(TodosCollectionConfig)],
})
export class TodosComponent {
  private renderScheduler = inject(RenderScheduler);
  private titleService = inject(Title);
  readonly todoStore = inject(TodoStore);

  trackByFn = (index: number, item: Todo) => {
    return item.last_modified;
  };

  constructor() {
    effect(() => {
      const { title } = this.todoStore;
      const titleString = title();
      this.titleService.setTitle(titleString);

      // INFO: Angular 17 doesn't provide way to detect changes with `signals` ONLY and no zone
      this.renderScheduler.schedule();
    });
  }
}
