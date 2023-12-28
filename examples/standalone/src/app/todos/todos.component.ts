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

  trackByFn = (index: number, item: Todo) => item.id;

  constructor() {
    effect(() => {
      const { title } = this.todoStore;
      const titleString = title();
      this.titleService.setTitle(titleString);
      this.cdRef.detectChanges();
    });
  }
}
